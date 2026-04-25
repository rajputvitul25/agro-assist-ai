# ML Backend

This FastAPI service powers crop monitoring for three supported crops:

- Sugarcane
- Wheat
- Rice

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Dataset Pipeline

The backend now uses public Zenodo archives instead of a Kaggle-only flow.

Download and prepare the normalized training dataset:

```bash
python download_dataset.py --pipeline
```

That creates:

- `data/source_archives`: downloaded source zip files
- `data/three_crop_dataset`: flattened `Crop___Disease` folders ready for training

Prepared classes include:

- `Sugarcane___Healthy`
- `Sugarcane___Mosaic`
- `Sugarcane___Red_Rot`
- `Sugarcane___Rust`
- `Sugarcane___Yellow_Leaf_Disease`
- `Wheat___Healthy`
- `Wheat___Brown_Rust`
- `Wheat___Powdery_Mildew`
- `Wheat___Septoria`
- `Wheat___Yellow_Rust`
- `Rice___Healthy`
- `Rice___Bacterial_Leaf_Blight`
- `Rice___Brown_Spot`
- `Rice___Leaf_Blast`

## Training

Train the current three-crop checkpoint:

```bash
python train_model.py --dataset-dir data/three_crop_dataset --output three_crop_model.pth
```

Useful options:

```bash
python train_model.py --pipeline
python train_model.py --epochs 1 --tune-last-block --initial-weights three_crop_model.pth --no-pretrained
python train_model.py --max-images-per-class 250
```

The training script writes:

- `three_crop_model.pth`
- `three_crop_model.json`

The JSON file stores architecture, class mapping, validation accuracy, and per-crop metrics.

## Running the API

```bash
python main.py
```

The API automatically prefers `three_crop_model.pth` when present.

Important endpoints:

- `GET /health`
- `GET /model-info`
- `POST /predict`
- `POST /batch-predict`
- `POST /download-three-crop-datasets`

Then open `http://localhost:8000/docs`.
