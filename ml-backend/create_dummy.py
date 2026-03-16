from PIL import Image
import os

base = 'data/dummy'
for crop in ['Sugarcane','Wheat','Rice']:
    for disease in ['Healthy','Disease1']:
        d = os.path.join(base,crop,disease)
        os.makedirs(d,exist_ok=True)
        img = Image.new('RGB',(224,224),(0,255,0))
        img.save(os.path.join(d,'img1.jpg'))
print('dummy dataset created at', base)
