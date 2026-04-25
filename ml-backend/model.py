import copy
import io
import json
import os
import random
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torchvision import models, transforms


IMAGE_SIZE = 224
DEFAULT_ARCHITECTURE = "resnet18"
DEFAULT_MODEL_CAPABILITY = "crop_and_disease"
MODEL_VERSION = "three-crop-v2"
RANDOM_SEED = 42


def _set_seed(seed: int = RANDOM_SEED):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def _is_image_file(path: str) -> bool:
    return os.path.splitext(path)[1].lower() in {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def _metadata_path(model_path: str) -> str:
    base, _ = os.path.splitext(model_path)
    return f"{base}.json"


def _normalize_crop_hint(crop_hint: Optional[str]) -> Optional[str]:
    if not crop_hint:
        return None

    normalized = crop_hint.strip().lower()
    aliases = {
        "sugarcane": "Sugarcane",
        "wheat": "Wheat",
        "rice": "Rice",
    }
    return aliases.get(normalized)


def _humanize_class_folder(folder_name: str) -> Tuple[str, str]:
    if "___" not in folder_name:
        raise ValueError(f"Invalid class folder name: {folder_name}")

    crop, disease = folder_name.split("___", 1)
    crop = crop.replace("_", " ").strip().title()
    disease = disease.replace("_", " ").strip()
    return crop, disease


def _format_class_name(crop: str, disease: str) -> str:
    return f"{crop}___{disease}".replace(" ", "_")


def _build_architecture(
    architecture: str,
    num_classes: int,
    pretrained: bool = False,
    legacy_classifier: bool = False,
) -> nn.Module:
    if architecture == "resnet18":
        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        model = models.resnet18(weights=weights)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, num_classes)
        return model

    if architecture == "resnet50":
        weights = models.ResNet50_Weights.DEFAULT if pretrained else None
        model = models.resnet50(weights=weights)
        in_features = model.fc.in_features
        if legacy_classifier:
            model.fc = nn.Sequential(
                nn.Linear(in_features, 512),
                nn.ReLU(),
                nn.Dropout(0.5),
                nn.Linear(512, 256),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(256, num_classes),
            )
        else:
            model.fc = nn.Linear(in_features, num_classes)
        return model

    raise ValueError(f"Unsupported architecture: {architecture}")


def _determine_architecture(model_state: Dict[str, torch.Tensor], metadata: Optional[Dict]) -> str:
    if metadata and metadata.get("architecture"):
        return metadata["architecture"]

    # Legacy fallback: the original project stored a ResNet50 checkpoint.
    if "layer4.2.conv3.weight" in model_state or "fc.0.weight" in model_state:
        return "resnet50"
    return DEFAULT_ARCHITECTURE


def _determine_num_classes(model_state: Dict[str, torch.Tensor], architecture: str) -> int:
    if architecture == "resnet18" and "fc.weight" in model_state:
        return int(model_state["fc.weight"].shape[0])
    if architecture == "resnet50" and "fc.weight" in model_state:
        return int(model_state["fc.weight"].shape[0])
    if architecture == "resnet50" and "fc.6.weight" in model_state:
        return int(model_state["fc.6.weight"].shape[0])
    raise ValueError("Unable to infer classifier output size from checkpoint")


def _uses_legacy_classifier(model_state: Dict[str, torch.Tensor]) -> bool:
    return "fc.6.weight" in model_state


def _default_metadata() -> Dict[str, object]:
    class_map = {
        0: ("Rice", "Healthy"),
        1: ("Rice", "Bacterial Leaf Blight"),
        2: ("Rice", "Brown Spot"),
        3: ("Rice", "Leaf Blast"),
        4: ("Sugarcane", "Healthy"),
        5: ("Sugarcane", "Mosaic"),
        6: ("Sugarcane", "Red Rot"),
        7: ("Sugarcane", "Rust"),
        8: ("Sugarcane", "Yellow Leaf Disease"),
        9: ("Wheat", "Healthy"),
        10: ("Wheat", "Brown Rust"),
        11: ("Wheat", "Powdery Mildew"),
        12: ("Wheat", "Septoria"),
        13: ("Wheat", "Yellow Rust"),
    }
    return {
        "version": MODEL_VERSION,
        "architecture": DEFAULT_ARCHITECTURE,
        "image_size": IMAGE_SIZE,
        "class_map": {str(index): list(value) for index, value in class_map.items()},
        "supported_crops": ["Sugarcane", "Wheat", "Rice"],
        "training_summary": {},
        "sources": [],
    }


@dataclass(frozen=True)
class ImageSample:
    path: str
    label: int
    class_name: str


class LeafDataset(Dataset):
    def __init__(self, samples: Sequence[ImageSample], transform: transforms.Compose):
        self.samples = list(samples)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int):
        sample = self.samples[index]
        image = Image.open(sample.path).convert("RGB")
        return self.transform(image), sample.label


def _collect_samples(dataset_dir: str) -> Tuple[List[ImageSample], List[str]]:
    if not os.path.isdir(dataset_dir):
        raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")

    class_names = sorted(
        entry
        for entry in os.listdir(dataset_dir)
        if os.path.isdir(os.path.join(dataset_dir, entry)) and "___" in entry
    )
    if not class_names:
        raise ValueError(f"No class folders found in dataset directory: {dataset_dir}")

    class_to_index = {class_name: idx for idx, class_name in enumerate(class_names)}
    samples: List[ImageSample] = []
    for class_name in class_names:
        class_dir = os.path.join(dataset_dir, class_name)
        for file_name in sorted(os.listdir(class_dir)):
            path = os.path.join(class_dir, file_name)
            if os.path.isfile(path) and _is_image_file(path):
                samples.append(ImageSample(path=path, label=class_to_index[class_name], class_name=class_name))

    if not samples:
        raise ValueError(f"No images found in dataset directory: {dataset_dir}")

    return samples, class_names


def _split_samples(samples: Sequence[ImageSample], val_fraction: float, seed: int) -> Tuple[List[ImageSample], List[ImageSample]]:
    grouped: Dict[int, List[ImageSample]] = defaultdict(list)
    for sample in samples:
        grouped[sample.label].append(sample)

    rng = random.Random(seed)
    train_samples: List[ImageSample] = []
    val_samples: List[ImageSample] = []
    for _, group in grouped.items():
        group = list(group)
        rng.shuffle(group)
        val_count = max(1, int(round(len(group) * val_fraction)))
        if len(group) <= 2:
            val_count = 1
        val_samples.extend(group[:val_count])
        train_samples.extend(group[val_count:])

    if not train_samples or not val_samples:
        raise ValueError("Unable to create a non-empty train/validation split")

    return train_samples, val_samples


def _cap_samples_per_class(samples: Sequence[ImageSample], max_images_per_class: Optional[int], seed: int) -> List[ImageSample]:
    if not max_images_per_class or max_images_per_class <= 0:
        return list(samples)

    grouped: Dict[int, List[ImageSample]] = defaultdict(list)
    for sample in samples:
        grouped[sample.label].append(sample)

    rng = random.Random(seed)
    capped_samples: List[ImageSample] = []
    for _, group in grouped.items():
        group = list(group)
        if len(group) > max_images_per_class:
            rng.shuffle(group)
            group = group[:max_images_per_class]
        capped_samples.extend(group)
    return capped_samples


def _build_transforms(train: bool) -> transforms.Compose:
    if train:
        return transforms.Compose(
            [
                transforms.Resize((256, 256)),
                transforms.RandomResizedCrop(IMAGE_SIZE, scale=(0.8, 1.0)),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(12),
                transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1, hue=0.03),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ]
        )

    return transforms.Compose(
        [
            transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )


def _class_distribution(samples: Sequence[ImageSample], class_names: Sequence[str]) -> Dict[str, int]:
    counts = Counter(sample.class_name for sample in samples)
    return {class_name: counts.get(class_name, 0) for class_name in class_names}


def _class_weights(train_samples: Sequence[ImageSample], class_names: Sequence[str], device: torch.device) -> torch.Tensor:
    counts = _class_distribution(train_samples, class_names)
    weights = []
    for class_name in class_names:
        count = counts[class_name]
        weights.append(1.0 / max(count, 1))
    tensor = torch.tensor(weights, dtype=torch.float32, device=device)
    return tensor / tensor.sum() * len(class_names)


def _weighted_sampler(train_samples: Sequence[ImageSample], class_names: Sequence[str]) -> WeightedRandomSampler:
    counts = _class_distribution(train_samples, class_names)
    weights = [1.0 / max(counts[sample.class_name], 1) for sample in train_samples]
    return WeightedRandomSampler(weights=weights, num_samples=len(train_samples), replacement=True)


def _class_map_from_names(class_names: Sequence[str]) -> Dict[int, Tuple[str, str]]:
    mapping: Dict[int, Tuple[str, str]] = {}
    for index, class_name in enumerate(class_names):
        mapping[index] = _humanize_class_folder(class_name)
    return mapping


def _crop_class_indices(class_map: Dict[int, Tuple[str, str]]) -> Dict[str, List[int]]:
    mapping: Dict[str, List[int]] = defaultdict(list)
    for index, (crop, _) in class_map.items():
        mapping[crop].append(index)
    return {crop: sorted(indices) for crop, indices in mapping.items()}


def _per_crop_accuracy(predictions: Sequence[int], labels: Sequence[int], class_map: Dict[int, Tuple[str, str]]) -> Dict[str, float]:
    crop_hits: Dict[str, int] = defaultdict(int)
    crop_total: Dict[str, int] = defaultdict(int)
    for prediction, label in zip(predictions, labels):
        crop, _ = class_map[label]
        crop_total[crop] += 1
        if prediction == label:
            crop_hits[crop] += 1

    return {
        crop: round((crop_hits[crop] / crop_total[crop]) * 100.0, 2)
        for crop in sorted(crop_total)
        if crop_total[crop] > 0
    }


def train_three_crop_model(
    dataset_dir: str,
    output_path: str = "three_crop_model.pth",
    architecture: str = DEFAULT_ARCHITECTURE,
    epochs: int = 2,
    batch_size: int = 64,
    learning_rate: float = 3e-4,
    val_fraction: float = 0.15,
    pretrained: bool = True,
    tune_last_block: bool = False,
    max_images_per_class: Optional[int] = 250,
    initial_weights: Optional[str] = None,
    seed: int = RANDOM_SEED,
) -> Dict[str, object]:
    _set_seed(seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    samples, class_names = _collect_samples(dataset_dir)
    samples = _cap_samples_per_class(samples, max_images_per_class=max_images_per_class, seed=seed)
    train_samples, val_samples = _split_samples(samples, val_fraction=val_fraction, seed=seed)

    train_dataset = LeafDataset(train_samples, transform=_build_transforms(train=True))
    val_dataset = LeafDataset(val_samples, transform=_build_transforms(train=False))

    sampler = _weighted_sampler(train_samples, class_names)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, sampler=sampler, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    model = _build_architecture(architecture=architecture, num_classes=len(class_names), pretrained=pretrained).to(device)
    if initial_weights and os.path.isfile(initial_weights):
        state_dict = torch.load(initial_weights, map_location=device)
        model.load_state_dict(state_dict)
    for parameter in model.parameters():
        parameter.requires_grad = False

    if architecture.startswith("resnet"):
        if tune_last_block:
            for parameter in model.layer4.parameters():
                parameter.requires_grad = True
        for parameter in model.fc.parameters():
            parameter.requires_grad = True

    optimizer = torch.optim.AdamW(
        (parameter for parameter in model.parameters() if parameter.requires_grad),
        lr=learning_rate,
        weight_decay=1e-4,
    )
    criterion = nn.CrossEntropyLoss(weight=_class_weights(train_samples, class_names, device))

    best_state: Optional[Dict[str, torch.Tensor]] = None
    best_metrics = {"val_accuracy": 0.0, "val_loss": float("inf")}

    for epoch in range(epochs):
        model.train()
        train_loss_total = 0.0
        train_items = 0
        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            logits = model(images)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()

            train_loss_total += loss.item() * labels.size(0)
            train_items += labels.size(0)

        model.eval()
        val_loss_total = 0.0
        val_items = 0
        correct = 0
        all_predictions: List[int] = []
        all_labels: List[int] = []
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                logits = model(images)
                loss = criterion(logits, labels)
                predictions = torch.argmax(logits, dim=1)

                val_loss_total += loss.item() * labels.size(0)
                val_items += labels.size(0)
                correct += int((predictions == labels).sum().item())
                all_predictions.extend(predictions.cpu().tolist())
                all_labels.extend(labels.cpu().tolist())

        train_loss = train_loss_total / max(train_items, 1)
        val_loss = val_loss_total / max(val_items, 1)
        val_accuracy = (correct / max(val_items, 1)) * 100.0
        print(
            f"Epoch {epoch + 1}/{epochs} | "
            f"train_loss={train_loss:.4f} | "
            f"val_loss={val_loss:.4f} | "
            f"val_accuracy={val_accuracy:.2f}%"
        )

        if (val_accuracy > best_metrics["val_accuracy"]) or (
            abs(val_accuracy - best_metrics["val_accuracy"]) < 1e-6 and val_loss < best_metrics["val_loss"]
        ):
            best_metrics = {"val_accuracy": round(val_accuracy, 2), "val_loss": round(val_loss, 4)}
            best_state = copy.deepcopy(model.state_dict())
            best_predictions = all_predictions
            best_labels = all_labels

    if best_state is None:
        raise RuntimeError("Training finished without producing a valid checkpoint")

    class_map = _class_map_from_names(class_names)
    metadata = {
        "version": MODEL_VERSION,
        "architecture": architecture,
        "image_size": IMAGE_SIZE,
        "model_capability": DEFAULT_MODEL_CAPABILITY,
        "supported_crops": sorted({crop for crop, _ in class_map.values()}),
        "class_map": {str(index): list(value) for index, value in class_map.items()},
        "training_summary": {
            "epochs": epochs,
            "batch_size": batch_size,
            "learning_rate": learning_rate,
            "tune_last_block": tune_last_block,
            "max_images_per_class": max_images_per_class,
            "initial_weights": initial_weights,
            "validation_accuracy": best_metrics["val_accuracy"],
            "validation_loss": best_metrics["val_loss"],
            "train_images": len(train_samples),
            "validation_images": len(val_samples),
            "per_crop_accuracy": _per_crop_accuracy(best_predictions, best_labels, class_map),
            "class_counts": _class_distribution(samples, class_names),
        },
        "sources": [
            "Zenodo sugarcane disease dataset (Healthy, Mosaic, Red Rot, Rust, Yellow Leaf Disease)",
            "Zenodo rice disease dataset (Bacterial Leaf Blight, Brown Spot, Leaf Blast)",
            "Zenodo healthy rice supplement",
            "Zenodo wheat disease images (Healthy, Brown Rust, Mildew, Septoria, Yellow Rust)",
        ],
    }

    torch.save(best_state, output_path)
    with open(_metadata_path(output_path), "w", encoding="utf-8") as metadata_file:
        json.dump(metadata, metadata_file, indent=2)

    return {
        "output_path": output_path,
        "metadata_path": _metadata_path(output_path),
        "validation_accuracy": best_metrics["val_accuracy"],
        "validation_loss": best_metrics["val_loss"],
        "num_classes": len(class_names),
        "class_counts": _class_distribution(samples, class_names),
    }


class PlantDiseaseDetector:
    def __init__(self, model_path: Optional[str] = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.image_size = IMAGE_SIZE

        metadata = _default_metadata()
        model_state: Optional[Dict[str, torch.Tensor]] = None

        if model_path and os.path.isfile(model_path):
            meta_path = _metadata_path(model_path)
            if os.path.isfile(meta_path):
                with open(meta_path, "r", encoding="utf-8") as metadata_file:
                    metadata = json.load(metadata_file)
            model_state = torch.load(model_path, map_location=self.device)

        self.metadata = metadata
        self.class_map = {
            int(index): (value[0], value[1])
            for index, value in metadata.get("class_map", {}).items()
        }

        architecture = metadata.get("architecture", DEFAULT_ARCHITECTURE)
        legacy_classifier = False
        if model_state is not None:
            architecture = _determine_architecture(model_state, metadata)
            num_classes = _determine_num_classes(model_state, architecture)
            legacy_classifier = _uses_legacy_classifier(model_state)
        else:
            num_classes = max(len(self.class_map), 1)

        if not self.class_map:
            fallback = _default_metadata()["class_map"]
            self.class_map = {int(index): (value[0], value[1]) for index, value in fallback.items()}

        self.architecture = architecture
        self.model = _build_architecture(
            architecture=architecture,
            num_classes=num_classes,
            pretrained=False,
            legacy_classifier=legacy_classifier,
        )
        if model_state is not None:
            self.model.load_state_dict(model_state)

        self.model = self.model.to(self.device)
        self.model.eval()
        self.crop_class_indices = _crop_class_indices(self.class_map)

    def preprocess_image(self, image_data: bytes) -> torch.Tensor:
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        transform = _build_transforms(train=False)
        return transform(image).unsqueeze(0).to(self.device)

    def _masked_probabilities(self, probabilities: torch.Tensor, crop_hint: Optional[str]) -> torch.Tensor:
        if crop_hint is None or crop_hint not in self.crop_class_indices:
            return probabilities

        mask = torch.zeros_like(probabilities)
        indices = self.crop_class_indices[crop_hint]
        mask[indices] = 1.0
        masked = probabilities * mask
        total = masked.sum()
        if float(total.item()) == 0.0:
            return probabilities
        return masked / total

    def _top_predictions(self, probabilities: torch.Tensor, limit: int = 3) -> List[Dict[str, object]]:
        values, indices = torch.topk(probabilities, k=min(limit, probabilities.numel()))
        top_predictions = []
        for value, index in zip(values.tolist(), indices.tolist()):
            crop, disease = self.class_map.get(index, ("Unknown", "Unknown"))
            top_predictions.append(
                {
                    "class_index": index,
                    "crop": crop,
                    "disease": disease,
                    "confidence": round(value * 100.0, 2),
                }
            )
        return top_predictions

    def _crop_probabilities(self, probabilities: torch.Tensor) -> Dict[str, float]:
        crop_scores: Dict[str, float] = defaultdict(float)
        for index, score in enumerate(probabilities.tolist()):
            crop, _ = self.class_map.get(index, ("Unknown", "Unknown"))
            crop_scores[crop] += score
        return {crop: round(score * 100.0, 2) for crop, score in sorted(crop_scores.items())}

    def predict(self, image_data: bytes, crop_hint: Optional[str] = None) -> Dict[str, object]:
        try:
            normalized_hint = _normalize_crop_hint(crop_hint)
            image_tensor = self.preprocess_image(image_data)

            with torch.no_grad():
                logits = self.model(image_tensor)[0]
                probabilities = torch.softmax(logits, dim=0)
                masked_probabilities = self._masked_probabilities(probabilities, normalized_hint)
                confidence, class_index = torch.max(masked_probabilities, dim=0)

            class_index = int(class_index.item())
            confidence_value = round(float(confidence.item()) * 100.0, 2)
            crop_type, disease = self.class_map.get(class_index, ("Unknown", "Unknown"))
            health_status = "healthy" if disease.lower() == "healthy" else "serious_issue"
            top_predictions = self._top_predictions(masked_probabilities, limit=3)
            crop_scores = self._crop_probabilities(probabilities)

            note: Optional[str] = None
            if confidence_value < 55.0:
                note = "Confidence is modest. Upload a brighter close-up of a single leaf for a stronger diagnosis."
            elif normalized_hint:
                note = f"Crop hint applied: prediction was restricted to {normalized_hint} disease classes."

            return {
                "crop_type": crop_type,
                "disease": disease,
                "confidence": confidence_value,
                "health_status": health_status,
                "ai_insights": _generate_insights(crop_type, disease, confidence_value, normalized_hint is not None),
                "disease_risks": _get_disease_risks(crop_type, disease),
                "pest_risks": _get_pest_risks(crop_type),
                "recommendations": _get_recommendations(crop_type, disease, confidence_value),
                "growth_stage": _estimate_growth_stage(crop_type),
                "yield_prediction": _predict_yield(crop_type, disease),
                "profitability_score": _calculate_profitability(crop_type, disease),
                "model_capability": self.metadata.get("model_capability", DEFAULT_MODEL_CAPABILITY),
                "prediction_note": note,
                "debug": {
                    "architecture": self.architecture,
                    "normalized_crop_hint": normalized_hint,
                    "top_predictions": top_predictions,
                    "crop_probabilities": crop_scores,
                    "validation_accuracy": self.metadata.get("training_summary", {}).get("validation_accuracy"),
                },
            }
        except Exception as exc:  # pragma: no cover - surfaced through API
            return {"error": str(exc)}


def _generate_insights(crop_type: str, disease: str, confidence: float, hint_used: bool) -> List[str]:
    insights = [
        f"Model classified the leaf as {crop_type} - {disease}.",
        f"Prediction confidence: {confidence:.2f}%.",
    ]
    if disease.lower() == "healthy":
        insights.append("No supported disease class scored higher than the healthy class for this image.")
    else:
        insights.append(f"Visible lesion pattern is closest to {disease} within the supported {crop_type.lower()} classes.")

    if hint_used:
        insights.append("Crop hint was used to restrict the classifier to the selected crop classes.")
    else:
        insights.append("If you already know the crop, selecting it in the UI usually improves specificity.")
    return insights


def _get_disease_risks(crop_type: str, current_disease: str) -> List[str]:
    risks = {
        "Sugarcane": ["Mosaic", "Red Rot", "Rust", "Yellow Leaf Disease"],
        "Wheat": ["Brown Rust", "Powdery Mildew", "Septoria", "Yellow Rust"],
        "Rice": ["Bacterial Leaf Blight", "Brown Spot", "Leaf Blast"],
    }
    return [risk for risk in risks.get(crop_type, []) if risk != current_disease]


def _get_pest_risks(crop_type: str) -> List[str]:
    pests = {
        "Sugarcane": ["Early shoot borer", "Pyrilla", "Scale insects"],
        "Wheat": ["Aphids", "Armyworm", "Termites"],
        "Rice": ["Stem borer", "Leaf folder", "Brown planthopper"],
    }
    return pests.get(crop_type, [])


def _get_recommendations(crop_type: str, disease: str, confidence: float) -> List[str]:
    if disease.lower() == "healthy":
        return {
            "Sugarcane": [
                "Continue field scouting once or twice per week.",
                "Keep drainage and ratoon sanitation in good condition.",
                "Capture a fresh image if yellow streaking or red lesions appear later.",
            ],
            "Wheat": [
                "Keep monitoring the canopy for rust pustules or powdery growth.",
                "Maintain balanced nitrogen use to avoid excessive disease pressure.",
                "Repeat scanning after major weather changes or irrigation events.",
            ],
            "Rice": [
                "Continue routine monitoring for fresh lesions near leaf tips and margins.",
                "Maintain stable water management and avoid unnecessary canopy stress.",
                "Rescan if spotting or blast-like lesions begin spreading.",
            ],
        }.get(crop_type, ["Continue normal scouting and upload a new image if symptoms change."])

    recommendations = {
        ("Sugarcane", "Mosaic"): [
            "Rogue heavily infected clumps to reduce spread.",
            "Use clean seed material for the next planting cycle.",
            "Control vector insects and avoid sharing infected setts.",
        ],
        ("Sugarcane", "Red Rot"): [
            "Remove badly affected canes and destroy infected residue.",
            "Improve drainage and avoid water stagnation in the field.",
            "Consult a local agronomist for a fungicide plan suitable to your region.",
        ],
        ("Sugarcane", "Rust"): [
            "Monitor disease spread across the upper leaves during humid periods.",
            "Improve airflow by reducing excessive weed pressure.",
            "Seek local fungicide guidance if lesions are rapidly expanding.",
        ],
        ("Sugarcane", "Yellow Leaf Disease"): [
            "Inspect neighbouring plants for yellowing along the midrib.",
            "Use healthy planting material and remove chronically affected stools.",
            "Track symptom progression over the next 5-7 days with new images.",
        ],
        ("Wheat", "Brown Rust"): [
            "Scout nearby leaves for orange-brown pustules and rapid spread.",
            "Discuss a rust-active fungicide with a local extension advisor if incidence is rising.",
            "Avoid delaying action when cool, humid weather is forecast.",
        ],
        ("Wheat", "Powdery Mildew"): [
            "Inspect lower leaves and dense canopy areas for fresh powdery growth.",
            "Improve field airflow where possible and avoid excess nitrogen.",
            "Rescan after 3-5 days to confirm whether lesions are expanding.",
        ],
        ("Wheat", "Septoria"): [
            "Check multiple leaves for necrotic blotches and dark pycnidia.",
            "Prioritize scouting after rain or prolonged leaf wetness.",
            "Discuss a septoria-targeted spray window if infection is active in the canopy.",
        ],
        ("Wheat", "Yellow Rust"): [
            "Inspect the field quickly for yellow linear pustule stripes.",
            "Treat early if disease is spreading through upper leaves.",
            "Repeat imaging on a second leaf to confirm consistency.",
        ],
        ("Rice", "Bacterial Leaf Blight"): [
            "Inspect leaf margins and tips for water-soaked or yellowing streaks.",
            "Avoid excessive nitrogen and check recent storm or wind injury.",
            "Discuss local management steps quickly if symptoms are spreading field-wide.",
        ],
        ("Rice", "Brown Spot"): [
            "Check additional leaves for round to oval brown lesions.",
            "Review nutrient balance, especially potassium and silicon availability.",
            "Capture another image from a different plant to confirm consistency.",
        ],
        ("Rice", "Leaf Blast"): [
            "Inspect for spindle-shaped lesions on multiple leaves.",
            "Reduce avoidable canopy stress and track spread after humid nights.",
            "Escalate quickly if blast lesions are moving into upper leaves.",
        ],
    }

    result = recommendations.get((crop_type, disease), ["Capture another close-up and review symptoms with a local agronomist."])
    if confidence < 60.0:
        result = list(result) + ["Confidence is moderate, so verify with one additional image from a separate plant."]
    return result


def _estimate_growth_stage(crop_type: str) -> str:
    return {
        "Sugarcane": "Leaf-stage scan only; growth stage cannot be estimated reliably from one leaf photo.",
        "Wheat": "Leaf-stage scan only; growth stage cannot be estimated reliably from one leaf photo.",
        "Rice": "Leaf-stage scan only; growth stage cannot be estimated reliably from one leaf photo.",
    }.get(crop_type, "Leaf-stage scan only.")


def _predict_yield(crop_type: str, disease: str) -> str:
    if disease.lower() == "healthy":
        return "No major supported disease detected in this image; yield impact appears limited from this scan alone."
    return "Potential yield impact depends on spread and timing; confirm with broader field scouting."


def _calculate_profitability(crop_type: str, disease: str) -> int:
    base = {"Sugarcane": 82, "Wheat": 78, "Rice": 80}.get(crop_type, 75)
    if disease.lower() == "healthy":
        return base
    return max(base - 22, 25)
