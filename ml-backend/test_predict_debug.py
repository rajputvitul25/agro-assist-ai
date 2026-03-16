import requests
from PIL import Image
import io

img = Image.new('RGB', (224, 224), color=(34, 139, 34))
buf = io.BytesIO(); img.save(buf, format='JPEG'); buf.seek(0)
files = {'file': ('leaf.jpg', buf, 'image/jpeg')}
resp = requests.post('http://localhost:8000/predict', files=files)
print('status', resp.status_code)
print(resp.json())
