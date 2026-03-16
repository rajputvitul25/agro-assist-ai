import requests
from PIL import Image
import io

# create a simple green square image (simulates leaf)
img = Image.new('RGB', (224, 224), color=(34,139,34))
buf = io.BytesIO()
img.save(buf, format='JPEG')
buf.seek(0)

files = {'file': ('leaf.jpg', buf, 'image/jpeg')}
print('Uploading sample image to /predict...')
resp = requests.post('http://localhost:8000/predict', files=files)
print('Status code:', resp.status_code)
print('Response JSON:', resp.json())
