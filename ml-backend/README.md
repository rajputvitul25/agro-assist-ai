# ML Backend

This directory contains the FastAPI service used by the smart farming assistant.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
```

You'll also need Kaggle credentials if you want to download/train on the
PlantVillage dataset. Place your `kaggle.json` under `~/.kaggle/` or set
`KAGGLE_CONFIG_DIR` to its folder.

## Download dataset

Use the helper script or API route to download and prepare your three crop datasets (Sugarcane, Wheat, Rice) from Kaggle:

```bash
python download_dataset.py --pipeline                    # downloads all 3 datasets and prepares flattened Crop___Disease dataset
python main.py --download-data                           # also downloads and prepares before starting API
```

You can also run each step separately:

```bash
python download_dataset.py --download --dest data/raw_three_crops
python download_dataset.py --prepare --src data/raw_three_crops --out data/filtered_three_crops
```

The prepared training dataset will be in `data/filtered_three_crops` and uses classes like `Sugarcane___Healthy`, `Wheat___Leaf_Rust`, etc.

```
Once downloaded, the images will reside in `data/plant_village` and can be
used by the training routine in `model.py`.

### Filtering for Three Crops

The full PlantVillage dataset contains dozens of plants but our monitoring
system only targets sugarcane, wheat and rice. Use `prepare_dataset.py` to
extract the relevant images and renormalise the folder structure so that
`torchvision.datasets.ImageFolder` treats **each disease as a separate
class**.  The resulting layout is *flat* - class names are of the form
`Crop___Disease`:

```bash
python prepare_dataset.py data/plant_village data/filtered_data
```

Example output:

```
filtered_data/
    Sugarcane___Healthy/
    Sugarcane___Red Rot Disease/
    Wheat___Healthy/
    Wheat___Leaf Rust/
    Rice___Healthy/
    Rice___Brown Spot/
    ...
```

Training on this directory will produce a model with eighteen output
classes (six diseases per crop).  The prediction logic now interprets the
network's class index using a dynamically built mapping, so the API returns
the correct crop and disease without any heuristic colour analysis.  This
fixes earlier mis-identification where sugarcane or wheat leaves were
reported as rice.

Point the training method at `data/filtered_data` when retraining the model.


## Training

The `PlantDiseaseDetector` class includes a `train()` method which can be
invoked from a Python shell or script:

```python
from model import PlantDiseaseDetector

detector = PlantDiseaseDetector()
detector.train("data/plant_village", epochs=10, output_path="trained.pth")
```

This will overwrite `model.pth` by default. After training, update the
`PlantDiseaseDetector.__init__` call in `main.py` to load the new weights.

## Running the API

```bash
python main.py
```

Then open `http://localhost:8000/docs` for interactive API docs.
