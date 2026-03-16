from model import PlantDiseaseDetector
from PIL import Image
import io

det = PlantDiseaseDetector()

def test(color):
    img = Image.new('RGB', (224, 224), color=color)
    buf = io.BytesIO(); img.save(buf, format='JPEG'); data = buf.getvalue()
    print(color, det.detect_crop_type(data))

for c in [(34, 139, 34), (184, 134, 11), (0, 100, 0), (255, 255, 255)]:
    test(c)
