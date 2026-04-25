import argparse
import json
import os

from download_dataset import download_three_crop_datasets, prepare_three_crop_dataset
from model import train_three_crop_model


def main():
    parser = argparse.ArgumentParser(description="Train the three-crop disease classifier")
    parser.add_argument("--dataset-dir", default="data/three_crop_dataset", help="Prepared dataset directory")
    parser.add_argument("--download", action="store_true", help="Download the public archives before training")
    parser.add_argument("--prepare", action="store_true", help="Prepare the normalized training dataset before training")
    parser.add_argument("--pipeline", action="store_true", help="Download, prepare, and train in one run")
    parser.add_argument("--output", default="three_crop_model.pth", help="Checkpoint output path")
    parser.add_argument("--epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--learning-rate", type=float, default=3e-4)
    parser.add_argument("--no-pretrained", action="store_true", help="Disable ImageNet pretrained weights")
    parser.add_argument("--tune-last-block", action="store_true", help="Unfreeze the last ResNet block in addition to the classifier head")
    parser.add_argument("--max-images-per-class", type=int, default=250, help="Cap large classes to speed up CPU training")
    parser.add_argument("--initial-weights", default="", help="Optional checkpoint path to continue training from")
    args = parser.parse_args()

    if args.pipeline or args.download:
        download_three_crop_datasets(dest_root="data/source_archives")

    if args.pipeline or args.prepare:
        prepare_three_crop_dataset(archive_root="data/source_archives", out_root=args.dataset_dir)

    summary = train_three_crop_model(
        dataset_dir=args.dataset_dir,
        output_path=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        pretrained=not args.no_pretrained,
        tune_last_block=args.tune_last_block,
        max_images_per_class=args.max_images_per_class,
        initial_weights=args.initial_weights or None,
    )
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
