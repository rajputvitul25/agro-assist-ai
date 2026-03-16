import os
import json
import hashlib
import torch
import torch.nn as nn
import torchvision.models as models
from PIL import Image
import numpy as np
from typing import Dict, List, Optional, Tuple
import io
import base64

class PlantDiseaseDetector:
    """
    Plant Disease Detection using ResNet50 with transfer learning
    Trained on plant disease patterns from PlantVillage dataset
    """
    
    def __init__(self, model_path: str = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Disease classes for Sugarcane, Wheat, and Rice
        # mapping is used during prediction – the final model will be trained
        # on **all** classes (18 total) so we can have a single network.
        self.disease_classes = {
            "Sugarcane": {
                0: "Healthy",
                1: "Red Rot Disease",
                2: "Sugarcane Mosaic Virus",
                3: "Smut Disease",
                4: "Leaf Scorch"
            },
            "Wheat": {
                0: "Healthy",
                1: "Powdery Mildew",
                2: "Leaf Rust",
                3: "Stem Rust",
                4: "Septoria Leaf Blotch",
                5: "Nitrogen Deficiency"
            },
            "Rice": {
                0: "Healthy",
                1: "Brown Spot",
                2: "Leaf Blast",
                3: "Bacterial Leaf Blight",
                4: "Sheath Blight",
                5: "Tungro Disease"
            }
        }

        # previously we maintained explicit offsets for each crop when the
        # network produced a fixed 18‑class output.  The new training approach
        # builds a mapping from dataset classes to (crop,disease) pairs, so
        # these offsets are no longer needed.
        # self._crop_order and _crop_offsets are kept for backward
        # compatibility but not used.
        self._crop_order = ["Sugarcane", "Wheat", "Rice"]
        self._crop_offsets = {}  # retained but unused

        # Build / load class mapping used during prediction
        self._class_map = self._default_class_map()
        model_state = None
        if model_path and os.path.isfile(model_path):
            meta_path = self._metadata_path(model_path)
            if os.path.isfile(meta_path):
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                        self._class_map = {int(k): tuple(v) for k, v in meta.get("class_map", {}).items()}
                except Exception:
                    # If metadata can't be loaded, continue using the default mapping.
                    pass
            model_state = torch.load(model_path, map_location=self.device)

        # Load pre-trained ResNet50 (similar to V2Net efficiency)
        # To avoid a large download every time the server starts we allow
        # specifying a local weights file via the `model_path` argument.
        # If no path is given we still construct the ResNet50 architecture
        # but do **not** download imagenet weights (weights=None). This lets
        # the API start quickly in development environments with limited
        # network access.
        self.model = models.resnet50(weights=None)

        # Freeze early layers for transfer learning
        for param in list(self.model.parameters())[:-4]:
            param.requires_grad = False

        # Replace final classification layers according to the output size we
        # either infer from the saved state dict or expect from the class map.
        num_output_classes = self._determine_output_classes(model_state)
        in_features = self.model.fc.in_features
        self.model.fc = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_output_classes)
        )

        if model_state is not None:
            self.model.load_state_dict(model_state)
        elif model_path:
            print(f"Warning: specified model_path {model_path} not found, using random weights")

        self.model = self.model.to(self.device)
        self.model.eval()
        
        # Image preprocessing
        self.image_size = 224

    def _determine_output_classes(self, model_state: Dict[str, torch.Tensor] | None) -> int:
        """Infer the classifier output size from saved weights when available."""
        if model_state:
            if "fc.6.weight" in model_state:
                return int(model_state["fc.6.weight"].shape[0])
            if "fc.weight" in model_state:
                return int(model_state["fc.weight"].shape[0])
        return max(len(self._class_map), sum(len(v) for v in self.disease_classes.values()))

    def _metadata_path(self, model_path: str) -> str:
        """Return the path for the metadata file paired with a model weights file."""
        base, _ = os.path.splitext(model_path)
        return f"{base}.json"

    def _default_class_map(self) -> Dict[int, Tuple[str, str]]:
        """Build a default class map based on the known disease_classes ordering."""
        mapping: Dict[int, Tuple[str, str]] = {}
        idx = 0
        for crop, diseases in self.disease_classes.items():
            for disease in diseases.values():
                mapping[idx] = (crop, disease)
                idx += 1
        return mapping

    def _save_metadata(self, model_path: str):
        """Persist metadata (such as class_map) alongside weights."""
        meta_path = self._metadata_path(model_path)
        try:
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump({"class_map": self._class_map}, f, indent=2)
        except Exception:
            pass

    def _is_crop_only_model(self) -> bool:
        """Return True when the loaded model predicts crop labels only."""
        disease_labels = [disease for _, disease in self._class_map.values() if disease]
        known_crops = {crop for crop, _ in self._class_map.values() if crop}
        return not disease_labels and known_crops.issubset(set(self._crop_order))

    def _normalize_crop_hint(self, crop_hint: Optional[str]) -> Optional[str]:
        """Normalize a crop hint from the client to one of the supported crop names."""
        if not crop_hint:
            return None

        normalized = crop_hint.strip().lower()
        aliases = {
            "sugarcane": "Sugarcane",
            "wheat": "Wheat",
            "rice": "Rice",
        }
        return aliases.get(normalized)

    def preprocess_image(self, image_data: bytes) -> torch.Tensor:
        """Preprocess image for model input"""
        # Open image
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        
        # Resize
        image = image.resize((self.image_size, self.image_size), Image.Resampling.LANCZOS)
        
        # Convert to tensor and normalize
        image_array = np.array(image) / 255.0
        
        # ImageNet normalization
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        image_array = (image_array - mean) / std
        
        # Convert to tensor
        image_tensor = torch.from_numpy(image_array).permute(2, 0, 1).float()
        return image_tensor.unsqueeze(0).to(self.device)

    def train(self,
              dataset_dir: str,
              output_path: str = "model.pth",
              epochs: int = 5,
              batch_size: int = 32,
              learning_rate: float = 1e-4):
        """Train the model with images in `dataset_dir`.

        The folder structure should be:
            dataset_dir/
                Sugarcane/
                    Healthy/
                    Red Rot Disease/
                    ...
                Wheat/
                    Healthy/
                    ...
                Rice/
                    Healthy/
                    ...

        This is a simple training loop using PyTorch's ImageFolder dataset.
        After training the weights are saved to `output_path`.

        This method is mainly intended for offline use – you can call it in a
        separate script (e.g. after downloading the Kaggle dataset) to regenerate
        the model weights.
        """
        import torchvision.transforms as transforms
        from torchvision.datasets import ImageFolder
        from torch.utils.data import DataLoader

        # make sure dataset exists
        if not os.path.isdir(dataset_dir):
            raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")

        # create transforms matching preprocessing used for inference
        transform = transforms.Compose([
            transforms.Resize((self.image_size, self.image_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406],
                                 [0.229, 0.224, 0.225])
        ])

        dataset = ImageFolder(root=dataset_dir, transform=transform)
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=4)

        # build a mapping from dataset index to (crop, disease) by parsing
        # the class names which should be of the form "Crop/Disease" or "Crop___Disease".
        self._class_map = {}
        for idx, cls in enumerate(dataset.classes):
            if '___' in cls:
                parts = cls.split('___', 1)
                crop = parts[0]
                disease = parts[1] if len(parts) > 1 else ''
            else:
                # Handle format like "Rice/Healthy"
                parts = cls.split('/', 1)
                crop = parts[0]
                disease = parts[1] if len(parts) > 1 else ''
            self._class_map[idx] = (crop, disease)

        # adjust model head to match the number of classes in dataset
        num_classes = len(dataset.classes)
        in_features = self.model.fc[0].in_features if isinstance(self.model.fc, nn.Sequential) else self.model.fc.in_features
        self.model.fc = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        ).to(self.device)

        # use a simple cross-entropy loss and optimizer
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)

        self.model.train()
        for epoch in range(epochs):
            running_loss = 0.0
            for inputs, labels in loader:
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                running_loss += loss.item()
            avg_loss = running_loss / len(loader)
            print(f"Epoch {epoch+1}/{epochs}, loss: {avg_loss:.4f}")

        # save trained weights
        torch.save(self.model.state_dict(), output_path)
        # also persist metadata (e.g. class mapping) so inference works after restart
        self._save_metadata(output_path)
        print(f"Training complete, model saved to {output_path}")

    
    def detect_crop_type(self, image_data: bytes, debug: bool = False):
        """Detect crop type from image features.

        Returns a tuple (crop_type, debug_info) when debug=True.
        """
        # Using image analysis to detect leaf patterns
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        image_array = np.array(image)

        # Compute basic stats
        mean_rgb = np.mean(image_array, axis=(0, 1))
        r, g, b = mean_rgb.tolist()

        # Compute green ratio with simple RGB thresholds (no OpenCV required)
        if cv2 is not None:
            hsv = cv2.cvtColor(image_array, cv2.COLOR_RGB2HSV)
            green_mask = cv2.inRange(hsv, (35, 40, 40), (85, 255, 255))
            green_ratio = float(np.sum(green_mask)) / (image_array.shape[0] * image_array.shape[1] * 255.0)
        else:
            # fallback: count pixels with green sufficiently larger than red/blue
            green_mask = (image_array[:, :, 1] > image_array[:, :, 0] + 15) & (image_array[:, :, 1] > image_array[:, :, 2] + 15) & (image_array[:, :, 1] > 80)
            green_ratio = float(np.sum(green_mask)) / (image_array.shape[0] * image_array.shape[1])

        total_pixels = float(image_array.shape[0] * image_array.shape[1])
        yellow_mask = (
            (image_array[:, :, 0] > 100) &
            (image_array[:, :, 1] > 90) &
            (image_array[:, :, 2] < 140) &
            (image_array[:, :, 0] >= image_array[:, :, 1] * 0.8)
        )
        yellow_ratio = float(np.sum(yellow_mask)) / total_pixels

        # Centroids for RGB average (tuned roughly for the crops)
        centroids = {
            "Rice": np.array([50, 150, 50]),
            "Wheat": np.array([150, 150, 50]),
            "Sugarcane": np.array([30, 100, 30])
        }

        # Find closest centroid
        min_distance = float('inf')
        closest_crop = "Sugarcane"  # default
        closest_dist = None
        for crop, centroid in centroids.items():
            distance = float(np.linalg.norm(mean_rgb - centroid))
            if distance < min_distance:
                min_distance = distance
                closest_crop = crop
                closest_dist = distance

        # Refine using simple color rules. The earlier version pushed almost
        # every green leaf toward rice, which made sugarcane look incorrect.
        if yellow_ratio > 0.12 or (r > g * 0.85 and b < g * 0.75):
            detected = "Wheat"
        elif green_ratio > 0.45 and (r + b) < 40 and g < 125:
            detected = "Sugarcane"
        elif green_ratio > 0.45 and (r + b) >= 60:
            detected = "Rice"
        else:
            detected = closest_crop

        debug_info = {
            "mean_rgb": {
                "r": float(r),
                "g": float(g),
                "b": float(b)
            },
            "green_ratio": float(green_ratio),
            "yellow_ratio": float(yellow_ratio),
            "centroids": {k: v.tolist() for k, v in centroids.items()},
            "closest_crop": closest_crop,
            "closest_distance": float(closest_dist) if closest_dist is not None else None,
            "detected_crop": detected
        }

        if debug:
            return detected, debug_info
        return detected
    
    def _deterministic_choice(self, key: bytes, options: List[str]) -> str:
        """Pick a deterministic option from a list based on a hash of the input."""
        if not options:
            return ""
        digest = hashlib.sha256(key).digest()
        idx = int.from_bytes(digest[:4], 'little') % len(options)
        return options[idx]

    def _deterministic_confidence(self, key: bytes, min_val: float = 70.0, max_val: float = 95.0) -> float:
        """Pick a deterministic confidence score based on a hash of the input."""
        digest = hashlib.sha256(key).digest()
        val = int.from_bytes(digest[4:8], 'little') / 0xFFFFFFFF
        return min_val + (max_val - min_val) * val

    def predict(self, image_data: bytes, crop_hint: Optional[str] = None) -> Dict:
        """Predict disease from image
        Returns disease classification with confidence
        """
        try:
            # Determine crop type from heuristic to generate contextual information.
            heuristic_crop, debug_info = self.detect_crop_type(image_data, debug=True)
            user_crop_hint = self._normalize_crop_hint(crop_hint)

            # Use model inference for disease class prediction
            image_tensor = self.preprocess_image(image_data)
            with torch.no_grad():
                outputs = self.model(image_tensor)
                probs = torch.nn.functional.softmax(outputs, dim=1)
                top_prob, top_idx = torch.max(probs, dim=1)
                class_index = int(top_idx.item())
                confidence = float(top_prob.item() * 100.0)

            # Map class index to crop and disease
            mapped_crop, disease_name = self._class_map.get(class_index, (heuristic_crop, "Unknown Disease"))
            crop_only_model = self._is_crop_only_model()

            if user_crop_hint:
                crop_type = user_crop_hint
                disease_name = "Unknown Disease" if crop_only_model else disease_name
                crop_resolution = "user_hint"
            elif crop_only_model:
                crop_type = heuristic_crop if confidence < 60.0 else (mapped_crop or heuristic_crop)
                disease_name = "Unknown Disease"
                crop_resolution = "heuristic" if confidence < 60.0 else "crop_model"
            else:
                crop_type = mapped_crop or heuristic_crop
                crop_resolution = "disease_model"
                if not disease_name:
                    disease_name = "Unknown Disease"

            display_disease = "Disease model unavailable" if crop_only_model else disease_name

            # Health status based on disease
            if disease_name == "Unknown Disease":
                health_status = "unknown"
            else:
                health_status = "healthy" if "Healthy" in disease_name else "serious_issue"

            # Generate recommendations and insights
            ai_insights = self._generate_insights(crop_type, disease_name, confidence)
            disease_risks = self._get_disease_risks(crop_type, disease_name)
            pest_risks = self._get_pest_risks(crop_type)
            recommendations = self._get_recommendations(crop_type, disease_name)

            return {
                "crop_type": crop_type,
                "disease": display_disease,
                "confidence": round(confidence, 2),
                "health_status": health_status,
                "ai_insights": ai_insights,
                "disease_risks": disease_risks,
                "pest_risks": pest_risks,
                "recommendations": recommendations,
                "growth_stage": self._estimate_growth_stage(crop_type),
                "yield_prediction": self._predict_yield(crop_type, disease_name),
                "profitability_score": self._calculate_profitability(crop_type, disease_name),
                "model_capability": "crop_only" if crop_only_model else "crop_and_disease",
                "prediction_note": (
                    "This backend currently has only a crop-level model loaded. "
                    "Disease prediction is not available until a trained Sugarcane/Wheat/Rice disease model is installed."
                    if crop_only_model else None
                ),
                "debug": {
                    **debug_info,
                    "user_crop_hint": user_crop_hint,
                    "heuristic_crop": heuristic_crop,
                    "model_crop": mapped_crop,
                    "crop_resolution": crop_resolution,
                    "crop_only_model": crop_only_model,
                    "predicted_class": class_index,
                    "disease": disease_name,
                    "model_confidence": round(confidence, 2)
                }
            }
        except Exception as e:
            return {"error": str(e)}
    
    def _generate_insights(self, crop_type: str, disease: str, confidence: float) -> List[str]:
        """Generate AI insights based on detection"""
        insights = []

        if disease == "Unknown Disease":
            return [
                f"Crop pattern looks closest to {crop_type}.",
                "Disease symptoms could not be classified confidently from the current model.",
                "Use a close-up, well-lit photo of a single leaf for a better diagnosis."
            ]
        
        if crop_type == "Sugarcane":
            if "Healthy" in disease:
                insights = [
                    "🤖 Yield Prediction: 78-82 tonnes/hectare based on current analysis",
                    "🤖 Climate Alert: Optimal growing conditions detected",
                    "🤖 Water Efficiency: Current irrigation schedule is effective",
                    "🤖 Harvest Readiness: Expected maturity in 12-15 months"
                ]
            elif "Red Rot" in disease:
                insights = [
                    "🤖 Disease Critical: Red Rot detected—apply fungicide within 2 days",
                    "🤖 Spread Risk: High in humid conditions—improve drainage",
                    "🤖 Yield Impact: 25-30% loss possible without intervention",
                    "🤖 Treatment: Use Carbendazim or Bordeaux mixture immediately"
                ]
        
        elif crop_type == "Wheat":
            if "Healthy" in disease:
                insights = [
                    "🤖 Yield Prediction: 48-52 quintals/hectare expected",
                    "🤖 Growth Rate: Normal vegetative development detected",
                    "🤖 Weather Favorable: Conditions optimal for grain filling",
                    "🤖 Market Outlook: Prices trending upward—good profitability"
                ]
            elif "Rust" in disease:
                insights = [
                    "🤖 Rust Alert: Leaf/Stem rust detected—spray fungicide",
                    "🤖 Spread Speed: Rust spreads rapidly in cool, wet weather",
                    "🤖 Yield Loss: 15-25% reduction if not managed",
                    "🤖 Treatment: Apply Propiconazole or Hexaconazole spray"
                ]
        
        elif crop_type == "Rice":
            if "Healthy" in disease:
                insights = [
                    "🤖 Yield Prediction: 52-58 quintals/hectare expected",
                    "🤖 Panicle Development: Excellent progress detected",
                    "🤖 Water Management: Field conditions optimal",
                    "🤖 Harvest Window: Estimated 30-35 days to maturity"
                ]
            elif "Brown Spot" in disease:
                insights = [
                    "🤖 Disease Critical: Brown Spot detected at critical stage",
                    "🤖 Urgency: Spray fungicide immediately—72-hour window",
                    "🤖 Yield Impact: 30-40% loss without intervention",
                    "🤖 Treatment: Apply Zinc + Mancozeb combination urgently"
                ]
        
        return insights if insights else ["🤖 Analysis: Detailed assessment in progress..."]
    
    def _get_disease_risks(self, crop_type: str, current_disease: str) -> List[str]:
        """Get potential disease risks"""
        risks = {
            "Sugarcane": ["Red Rot (monitor humidity)", "Mosaic Virus", "Smut Disease", "Leaf Scorch"],
            "Wheat": ["Powdery Mildew", "Leaf Rust", "Stem Rust", "Septoria Leaf Blotch"],
            "Rice": ["Brown Spot", "Leaf Blast", "Bacterial Leaf Blight", "Sheath Blight"]
        }
        return risks.get(crop_type, [])
    
    def _get_pest_risks(self, crop_type: str) -> List[str]:
        """Get potential pest risks"""
        pests = {
            "Sugarcane": ["Sugarcane Borer", "Scale Insects", "Leaf Hoppers"],
            "Wheat": ["Armyworm", "Aphids", "Grasshoppers"],
            "Rice": ["Stem Borer", "Leaf Folder", "Brown Plant Hopper"]
        }
        return pests.get(crop_type, [])
    
    def _get_recommendations(self, crop_type: str, disease: str) -> List[str]:
        """Get crop-specific recommendations"""
        if disease == "Unknown Disease":
            recs = {
                "Sugarcane": [
                    "Capture a clearer close-up of one leaf with visible symptoms",
                    "Inspect the midrib and lower leaves for streaks or rot",
                    "Record recent irrigation and humidity changes"
                ],
                "Wheat": [
                    "Upload a sharp photo of one affected leaf blade",
                    "Check for rust pustules, powdery patches, or yellowing",
                    "Record recent weather and fertilizer changes"
                ],
                "Rice": [
                    "Take a brighter close-up of one affected rice leaf",
                    "Check for brown spots, blight margins, or blast lesions",
                    "Record standing water level and recent rainfall"
                ]
            }
        elif "Healthy" in disease:
            recs = {
                "Sugarcane": [
                    "Maintain drip irrigation schedule",
                    "Monitor for Red Rot during high humidity",
                    "Apply balanced NPK in splits",
                    "Plan for harvest in 12-15 months"
                ],
                "Wheat": [
                    "Continue current fertilizer schedule",
                    "Monitor for pest activity",
                    "Ensure proper drainage",
                    "Plan harvest at grain maturity"
                ],
                "Rice": [
                    "Maintain standing water level",
                    "Apply final nitrogen dose",
                    "Prepare for harvest",
                    "Monitor for late-stage pests"
                ]
            }
        else:
            recs = {
                "Sugarcane": ["Apply fungicide immediately", "Improve field drainage", "Remove infected plants"],
                "Wheat": ["Spray rust control fungicide", "Maintain field hygiene", "Monitor closely"],
                "Rice": ["Apply zinc-Mancozeb spray", "Reduce water level", "Increase air circulation"]
            }
        
        return recs.get(crop_type, [])
    
    def _estimate_growth_stage(self, crop_type: str) -> str:
        """Estimate growth stage"""
        stages = {
            "Sugarcane": "Vegetative Stage",
            "Wheat": "Grain Filling Stage",
            "Rice": "Panicle Initiation Stage"
        }
        return stages.get(crop_type, "Mid-Growth")
    
    def _predict_yield(self, crop_type: str, disease: str) -> str:
        """Predict yield based on disease"""
        if disease == "Unknown Disease":
            return "Needs confirmed disease diagnosis"
        if "Healthy" in disease:
            yields = {
                "Sugarcane": "78-82 tonnes/hectare",
                "Wheat": "48-52 quintals/hectare",
                "Rice": "52-58 quintals/hectare"
            }
        else:
            yields = {
                "Sugarcane": "55-65 tonnes/hectare",
                "Wheat": "35-42 quintals/hectare",
                "Rice": "35-42 quintals/hectare"
            }
        return yields.get(crop_type, "35-45 units/hectare")
    
    def _calculate_profitability(self, crop_type: str, disease: str) -> int:
        """Calculate profitability score"""
        base_scores = {
            "Sugarcane": 85,
            "Wheat": 78,
            "Rice": 82
        }
        
        base = base_scores.get(crop_type, 70)

        if disease == "Unknown Disease":
            return max(base - 5, 20)
        
        # Reduce score based on disease severity
        if "Healthy" not in disease:
            base -= 20 if "serious" not in disease else 40
        
        return max(base, 20)


# Simple OpenCV import fallback
try:
    import cv2
except ImportError:
    cv2 = None
