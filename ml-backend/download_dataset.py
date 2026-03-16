import os
import zipfile
import shutil
from kagglehub import dataset_download

DATASETS = {
    "Sugarcane": "akilesh253/sugarcane-plant-diseases-dataset",
    "Wheat": "kushagra3204/wheat-plant-diseases",
    "Rice": "maimunulkjisan/rice-leaf-dataset-from-mendeley-data"
}


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)
    return path


def _is_image_file(filename: str) -> bool:
    return filename.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'))


def _unpack_zip_if_needed(path: str) -> str:
    if zipfile.is_zipfile(path):
        dest_dir = os.path.splitext(path)[0]
        _ensure_dir(dest_dir)
        with zipfile.ZipFile(path, 'r') as z:
            z.extractall(dest_dir)
        return dest_dir
    return path


def download_three_crop_datasets(dest_root: str = "data/raw_three_crops") -> dict:
    """Download the three Kaggle datasets for sugarcane, wheat, and rice."""
    _ensure_dir(dest_root)
    output_paths = {}

    for crop, dataset_id in DATASETS.items():
        crop_dest = os.path.join(dest_root, crop)
        _ensure_dir(crop_dest)
        print(f"Downloading {crop} dataset ({dataset_id}) to {crop_dest}...")
        downloaded = dataset_download(dataset_id, path=crop_dest)
        # dataset_download may return a zip or extracted path
        if isinstance(downloaded, str) and os.path.isfile(downloaded):
            downloaded = _unpack_zip_if_needed(downloaded)
        output_paths[crop] = downloaded
        print(f"Downloaded {crop} dataset to {downloaded}")

    return output_paths


def prepare_three_crop_dataset(raw_root: str = "data/raw_three_crops", out_root: str = "data/filtered_three_crops") -> str:
    """Prepare the raw datasets into flat ImageFolder-compatible directory structure.

    Sources with nested directories are flattened into Crop___Disease directories.
    """
    _ensure_dir(out_root)

    if not os.path.isdir(raw_root):
        raise FileNotFoundError(f"Raw dataset folder not found: {raw_root}")

    for crop in DATASETS.keys():
        crop_root = os.path.join(raw_root, crop)
        if not os.path.isdir(crop_root):
            print(f"Warning: {crop_root} not found; skipping crop {crop}")
            continue

        for root, dirs, files in os.walk(crop_root):
            image_files = [f for f in files if _is_image_file(f)]
            if not image_files:
                continue

            rel = os.path.relpath(root, crop_root)
            if rel == '.' or rel == '..':
                disease_label = 'Unknown'
            else:
                disease_label = rel.replace(os.sep, ' ').strip()

            class_name = f"{crop}___{disease_label}".replace(' ', '_')
            target_dir = os.path.join(out_root, class_name)
            _ensure_dir(target_dir)

            for fname in image_files:
                src_path = os.path.join(root, fname)
                dst_path = os.path.join(target_dir, fname)
                try:
                    shutil.copy2(src_path, dst_path)
                except Exception:
                    # skip problematic files
                    pass

    return out_root


def fetch_plant_village(dest_dir: str = "data/plant_village") -> str:
    """Backward compatibility: download the old PlantVillage dataset."""
    _ensure_dir(dest_dir)
    print(f"Downloading PlantVillage dataset into {dest_dir}...")
    path = dataset_download("tushar5harma/plant-village-dataset-updated", path=dest_dir)
    if isinstance(path, str) and os.path.isfile(path):
        path = _unpack_zip_if_needed(path)
    return path


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Download and prepare crop datasets")
    parser.add_argument("--dest", default="data/raw_three_crops", help="Raw datasets output directory")
    parser.add_argument("--out", default="data/filtered_three_crops", help="Prepared dataset output directory")
    parser.add_argument("--download", action="store_true", help="Download the three crop datasets")
    parser.add_argument("--prepare", action="store_true", help="Prepare filtered dataset from raw download")
    parser.add_argument("--pipeline", action="store_true", help="Download then prepare in one run")
    args = parser.parse_args()

    if args.pipeline or args.download:
        print("Downloading three crop datasets...")
        result = download_three_crop_datasets(dest_root=args.dest)
        print("Downloaded:", result)

    if args.pipeline or args.prepare:
        print("Preparing filtered data...")
        out = prepare_three_crop_dataset(raw_root=args.dest, out_root=args.out)
        print("Prepared dataset at", out)
