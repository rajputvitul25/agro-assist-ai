import requests
from PIL import Image
import io

# Create three synthetic images with different base colors to exercise crop detection
variants = {
    "rice_like": (34, 139, 34),       # vibrant green
    "wheat_like": (184, 134, 11),     # golden/brown
    "sugarcane_like": (0, 100, 0),    # darker green
}

for name, color in variants.items():
    img = Image.new('RGB', (224, 224), color=color)
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    buf.seek(0)

    files = {'file': (f'{name}.jpg', buf, 'image/jpeg')}
    print(f"--- Testing {name} (color={color}) ---")
    resp = requests.post('http://localhost:8000/predict', files=files)
    print('Status code:', resp.status_code)
    print('Response JSON:', resp.json())
    print()
