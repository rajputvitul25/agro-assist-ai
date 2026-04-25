import argparse
import hashlib
import os
import shutil
import urllib.request
import zipfile
from typing import Dict, Iterable, Optional, Tuple


DATASET_SOURCES = {
    "Sugarcane": {
        "archive_name": "sugarcane.zip",
        "url": "https://zenodo.org/records/14964141/files/SugarcaneDiseases.zip?download=1",
    },
    "RiceDisease": {
        "archive_name": "rice.zip",
        "url": "https://zenodo.org/records/15817084/files/Rice%20Leaf%20Disease%20Dataset.zip?download=1",
    },
    "RiceHealthy": {
        "archive_name": "rice_healthy.zip",
        "url": "https://zenodo.org/records/17175416/files/ORYSA_healthy%20leaves.zip?download=1",
    },
    "Wheat": {
        "archive_name": "wheat.zip",
        "url": "https://zenodo.org/records/7573133/files/Long%202023%20Plant%20Path%20999%20photos.zip?download=1",
    },
}


CLASS_LABELS = {
    "Sugarcane": {
        "Healthy": ("Sugarcane", "Healthy"),
        "Mosaic": ("Sugarcane", "Mosaic"),
        "RedRot": ("Sugarcane", "Red Rot"),
        "Rust": ("Sugarcane", "Rust"),
        "Yellow": ("Sugarcane", "Yellow Leaf Disease"),
    },
    "RiceDisease": {
        "Bacterial leaf blight": ("Rice", "Bacterial Leaf Blight"),
        "Brown spot": ("Rice", "Brown Spot"),
        "Leaf Blast": ("Rice", "Leaf Blast"),
    },
    "RiceHealthy": {
        "ORYSA_healthy leaves": ("Rice", "Healthy"),
    },
    "Wheat": {
        "BrownRust": ("Wheat", "Brown Rust"),
        "Healthy": ("Wheat", "Healthy"),
        "Mildew": ("Wheat", "Powdery Mildew"),
        "Septoria": ("Wheat", "Septoria"),
        "YellowRust": ("Wheat", "Yellow Rust"),
    },
}


VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def _ensure_dir(path: str) -> str:
    os.makedirs(path, exist_ok=True)
    return path


def _is_image_file(path: str) -> bool:
    return os.path.splitext(path)[1].lower() in VALID_IMAGE_EXTENSIONS


def _download_file(url: str, dest_path: str, chunk_size: int = 1024 * 1024) -> str:
    _ensure_dir(os.path.dirname(dest_path))
    if os.path.isfile(dest_path) and os.path.getsize(dest_path) > 0:
        return dest_path

    with urllib.request.urlopen(url) as response, open(dest_path, "wb") as output_file:
        while True:
            chunk = response.read(chunk_size)
            if not chunk:
                break
            output_file.write(chunk)
    return dest_path


def download_three_crop_datasets(dest_root: str = "data/source_archives", force: bool = False) -> Dict[str, str]:
    _ensure_dir(dest_root)
    downloaded: Dict[str, str] = {}

    for source_name, source in DATASET_SOURCES.items():
        archive_path = os.path.join(dest_root, source["archive_name"])
        if force and os.path.isfile(archive_path):
            os.remove(archive_path)
        downloaded[source_name] = _download_file(source["url"], archive_path)

    return downloaded


def _safe_name(name: str) -> str:
    cleaned = name.replace("\\", "_").replace("/", "_").replace(" ", "_")
    return "".join(ch for ch in cleaned if ch.isalnum() or ch in {"_", "-", "."})


def _target_filename(member_name: str) -> str:
    original = os.path.basename(member_name)
    stem, ext = os.path.splitext(original)
    digest = hashlib.sha1(member_name.encode("utf-8")).hexdigest()[:10]
    return f"{_safe_name(stem)}_{digest}{ext.lower()}"


def _class_dir(out_root: str, crop: str, disease: str) -> str:
    folder = f"{crop}___{disease}".replace(" ", "_")
    return _ensure_dir(os.path.join(out_root, folder))


def _reset_output_dir(path: str):
    if os.path.isdir(path):
        shutil.rmtree(path)
    os.makedirs(path, exist_ok=True)


def _extract_zip_member(zip_file: zipfile.ZipFile, member_name: str, dest_path: str):
    with zip_file.open(member_name) as source, open(dest_path, "wb") as target:
        shutil.copyfileobj(source, target)


def _prepare_sugarcane_dataset(archive_path: str, out_root: str, class_counts: Dict[str, int]):
    label_map = CLASS_LABELS["Sugarcane"]
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.namelist():
            if member.endswith("/") or not _is_image_file(member):
                continue

            top_level = member.split("/", 1)[0]
            if top_level not in label_map:
                continue

            crop, disease = label_map[top_level]
            target_dir = _class_dir(out_root, crop, disease)
            target_path = os.path.join(target_dir, _target_filename(member))
            _extract_zip_member(archive, member, target_path)
            class_counts[f"{crop}___{disease}"] = class_counts.get(f"{crop}___{disease}", 0) + 1


def _prepare_rice_disease_dataset(archive_path: str, out_root: str, class_counts: Dict[str, int]):
    label_map = CLASS_LABELS["RiceDisease"]
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.namelist():
            if member.endswith("/") or not _is_image_file(member):
                continue

            parts = member.split("/")
            if len(parts) < 4:
                continue
            if parts[0] != "Rice Leaf Disease Dataset":
                continue

            disease_name = parts[2]
            if disease_name not in label_map:
                continue

            crop, disease = label_map[disease_name]
            target_dir = _class_dir(out_root, crop, disease)
            target_path = os.path.join(target_dir, _target_filename(member))
            _extract_zip_member(archive, member, target_path)
            class_counts[f"{crop}___{disease}"] = class_counts.get(f"{crop}___{disease}", 0) + 1


def _prepare_rice_healthy_dataset(archive_path: str, out_root: str, class_counts: Dict[str, int]):
    label_map = CLASS_LABELS["RiceHealthy"]
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.namelist():
            if member.endswith("/") or not _is_image_file(member):
                continue

            top_level = member.split("/", 1)[0]
            if top_level not in label_map:
                continue

            crop, disease = label_map[top_level]
            target_dir = _class_dir(out_root, crop, disease)
            target_path = os.path.join(target_dir, _target_filename(member))
            _extract_zip_member(archive, member, target_path)
            class_counts[f"{crop}___{disease}"] = class_counts.get(f"{crop}___{disease}", 0) + 1


def _detect_wheat_label(filename: str) -> Optional[Tuple[str, str]]:
    label_map = CLASS_LABELS["Wheat"]
    for prefix, mapping in label_map.items():
        if filename.startswith(prefix):
            return mapping
    return None


def _prepare_wheat_dataset(archive_path: str, out_root: str, class_counts: Dict[str, int]):
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.namelist():
            if member.endswith("/") or not _is_image_file(member):
                continue

            filename = os.path.basename(member)
            mapping = _detect_wheat_label(filename)
            if mapping is None:
                continue

            crop, disease = mapping
            target_dir = _class_dir(out_root, crop, disease)
            target_path = os.path.join(target_dir, _target_filename(member))
            _extract_zip_member(archive, member, target_path)
            class_counts[f"{crop}___{disease}"] = class_counts.get(f"{crop}___{disease}", 0) + 1


def prepare_three_crop_dataset(archive_root: str = "data/source_archives", out_root: str = "data/three_crop_dataset") -> Dict[str, object]:
    _reset_output_dir(out_root)
    class_counts: Dict[str, int] = {}

    required_archives = {
        "Sugarcane": os.path.join(archive_root, DATASET_SOURCES["Sugarcane"]["archive_name"]),
        "RiceDisease": os.path.join(archive_root, DATASET_SOURCES["RiceDisease"]["archive_name"]),
        "RiceHealthy": os.path.join(archive_root, DATASET_SOURCES["RiceHealthy"]["archive_name"]),
        "Wheat": os.path.join(archive_root, DATASET_SOURCES["Wheat"]["archive_name"]),
    }

    missing = [path for path in required_archives.values() if not os.path.isfile(path)]
    if missing:
        raise FileNotFoundError(f"Missing source archives: {missing}")

    _prepare_sugarcane_dataset(required_archives["Sugarcane"], out_root, class_counts)
    _prepare_rice_disease_dataset(required_archives["RiceDisease"], out_root, class_counts)
    _prepare_rice_healthy_dataset(required_archives["RiceHealthy"], out_root, class_counts)
    _prepare_wheat_dataset(required_archives["Wheat"], out_root, class_counts)

    return {
        "dataset_root": out_root,
        "class_counts": dict(sorted(class_counts.items())),
        "total_images": int(sum(class_counts.values())),
    }


def fetch_plant_village(dest_dir: str = "data/plant_village") -> str:
    _ensure_dir(dest_dir)
    return dest_dir


def _format_summary(summary: Dict[str, object]) -> str:
    if "class_counts" not in summary:
        return str(summary)

    lines = [f"dataset_root: {summary['dataset_root']}", f"total_images: {summary['total_images']}"]
    for class_name, count in summary["class_counts"].items():
        lines.append(f"  {class_name}: {count}")
    return "\n".join(lines)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download and prepare three-crop image datasets")
    parser.add_argument("--dest", default="data/source_archives", help="Archive download directory")
    parser.add_argument("--out", default="data/three_crop_dataset", help="Prepared dataset output directory")
    parser.add_argument("--download", action="store_true", help="Download the public source archives")
    parser.add_argument("--prepare", action="store_true", help="Prepare the combined training dataset")
    parser.add_argument("--pipeline", action="store_true", help="Download archives and prepare the dataset")
    parser.add_argument("--force", action="store_true", help="Redownload archives even if they already exist")
    args = parser.parse_args()

    if args.pipeline or args.download:
        result = download_three_crop_datasets(dest_root=args.dest, force=args.force)
        print("Downloaded archives:")
        for key, value in result.items():
            print(f"  {key}: {value}")

    if args.pipeline or args.prepare:
        summary = prepare_three_crop_dataset(archive_root=args.dest, out_root=args.out)
        print("Prepared dataset summary:")
        print(_format_summary(summary))
