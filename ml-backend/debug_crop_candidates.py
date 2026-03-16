from model import PlantDiseaseDetector
from PIL import Image
import io

det = PlantDiseaseDetector()

def crop_for(color):
    img = Image.new('RGB', (224, 224), color=color)
    buf = io.BytesIO(); img.save(buf, 'JPEG');
    return det.detect_crop_type(buf.getvalue())

candidates = [
    (100, 180, 100),
    (120, 160, 90),
    (140, 180, 100),
    (80, 140, 70),
    (160, 200, 120),
]

for c in candidates:
    print(c, crop_for(c))
