"""Utility to prepare image datasets in flat Crop___Disease format.

This script takes raw downloaded images (possibly nested per-disease folders)
and copies image files into an ImageFolder-friendly directory structure
where each class directory is named "Crop___Disease".
"""

import os
import shutil
import argparse


def _is_image(filename: str) -> bool:
    return filename.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'))


def _sanitize_label(label: str) -> str:
    return label.replace(os.sep, ' ').replace('_', ' ').strip().replace(' ', '_')


def prepare_dataset(src_root: str, dst_root: str):
    if not os.path.isdir(src_root):
        raise FileNotFoundError(f"source root not found: {src_root}")

    os.makedirs(dst_root, exist_ok=True)

    for root, _, files in os.walk(src_root):
        image_files = [f for f in files if _is_image(f)]
        if not image_files:
            continue

        rel = os.path.relpath(root, src_root)
        if rel in ('.', '..'):
            continue

        parts = rel.split(os.sep)
        if len(parts) == 1:
            crop = _sanitize_label(parts[0])
            disease = 'Unknown'
        else:
            crop = _sanitize_label(parts[0])
            disease = _sanitize_label('_'.join(parts[1:]))

        class_name = f"{crop}___{disease}"
        target_dir = os.path.join(dst_root, class_name)
        os.makedirs(target_dir, exist_ok=True)

        for fname in image_files:
            src_path = os.path.join(root, fname)
            dst_path = os.path.join(target_dir, fname)
            try:
                shutil.copy2(src_path, dst_path)
            except Exception:
                pass

    print(f"Prepared dataset at {dst_root}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prepare Crop___Disease dataset structure')
    parser.add_argument('src', help='source root directory with downloaded images')
    parser.add_argument('dst', help='destination structure directory')
    args = parser.parse_args()

    prepare_dataset(args.src, args.dst)

