@echo off
echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Starting Plant Disease Detection API...
echo API will run on http://localhost:8000
echo.

python main.py
