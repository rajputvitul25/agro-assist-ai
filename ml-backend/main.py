from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from model import PlantDiseaseDetector
import os
from typing import Optional, List, Any, Dict
import logging
from threading import Lock
from auth_store import ensure_demo_user, ensure_admin_user, get_auth_overview, initialize_auth_db, login_user, register_user

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Plant Disease Detection API",
    description="ML-powered crop disease detection using CNN",
    version="1.0.0"
)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize_auth_db()
ensure_demo_user()
ensure_admin_user()

model_weights = os.getenv("MODEL_WEIGHTS")
default_model_path = os.path.join(os.path.dirname(__file__), "model.pth")
resolved_model_path = model_weights or (default_model_path if os.path.isfile(default_model_path) else None)
detector: Optional[PlantDiseaseDetector] = None
detector_lock = Lock()


def get_detector() -> PlantDiseaseDetector:
    global detector

    if detector is not None:
        return detector

    with detector_lock:
        if detector is not None:
            return detector

        logger.info("Loading Plant Disease Detection Model...")
        if resolved_model_path:
            logger.info("Using model weights from %s", resolved_model_path)
        else:
            logger.warning("No model weights found; predictions will use an untrained model")

        detector = PlantDiseaseDetector(model_path=resolved_model_path)
        logger.info("Model loaded successfully!")
        return detector


# Pydantic models
class PredictionResponse(BaseModel):
    crop_type: str
    disease: str
    confidence: float
    health_status: str
    ai_insights: List[str]
    disease_risks: List[str]
    pest_risks: List[str]
    recommendations: List[str]
    growth_stage: str
    yield_prediction: str
    profitability_score: int
    model_capability: Optional[str] = None
    prediction_note: Optional[str] = None
    debug: Optional[Dict[str, Any]] = None


class HealthCheck(BaseModel):
    status: str
    message: str


class AuthLoginRequest(BaseModel):
    email: str
    password: str


class AuthRegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class AuthUser(BaseModel):
    id: str
    email: str
    name: str
    created_at: Optional[str] = None
    last_login_at: Optional[str] = None
    login_count: Optional[int] = 0


class AuthResponse(BaseModel):
    user: AuthUser


class AuthSummary(BaseModel):
    total_users: int
    total_logins: int
    failed_logins: int
    latest_activity_at: Optional[str] = None


class AuthEvent(BaseModel):
    id: int
    user_id: Optional[str] = None
    email: str
    event_type: str
    status: str
    details: Optional[str] = None
    occurred_at: str


class AuthOverviewResponse(BaseModel):
    database_path: str
    summary: AuthSummary
    users: List[AuthUser]
    events: List[AuthEvent]


# Routes

from download_dataset import download_three_crop_datasets, prepare_three_crop_dataset, fetch_plant_village


@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Check if API is running"""
    return {
        "status": "healthy",
        "message": "Plant Disease Detection API is running"
    }


@app.post("/auth/register", response_model=AuthResponse)
async def register(request: AuthRegisterRequest) -> AuthResponse:
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = register_user(
        name=request.name,
        email=request.email,
        password=request.password,
    )
    if user is None:
        raise HTTPException(status_code=409, detail="Email already exists")

    return {"user": user}


@app.post("/auth/login", response_model=AuthResponse)
async def login(request: AuthLoginRequest) -> AuthResponse:
    user = login_user(email=request.email, password=request.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"user": user}


@app.get("/auth/overview", response_model=AuthOverviewResponse)
async def auth_overview(limit: int = 50) -> AuthOverviewResponse:
    return get_auth_overview(limit=limit)


@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(
    file: UploadFile = File(...),
    crop_hint: Optional[str] = Form(None)
) -> PredictionResponse:
    """
    Upload a crop image and get disease prediction

    Supported crops: Sugarcane, Wheat, Rice
    Returns detailed disease analysis with AI insights
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read image data
        image_data = await file.read()

        if len(image_data) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        logger.info(f"Processing image: {file.filename}")

        # Get prediction from model
        result = get_detector().predict(image_data, crop_hint=crop_hint)

        if "error" in result:
            raise HTTPException(status_code=500, detail=f"Prediction error: {result['error']}")

        logger.info(f"Prediction complete for {file.filename}: {result['disease']}")

        return PredictionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/batch-predict")
async def batch_predict(files: List[UploadFile] = File(...)):
    """
    Process multiple images at once
    """
    results = []

    for file in files:
        try:
            image_data = await file.read()
            result = detector.predict(image_data)
            if "error" not in result:
                results.append({
                    "filename": file.filename,
                    "prediction": result
                })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "error": str(e)
            })

    return results


@app.get("/model-info")
async def model_info():
    """Get information about the model"""
    return {
        "model_name": "PlantDiseaseDetector v1",
        "architecture": "ResNet50 with Transfer Learning",
        "dataset": "Three Kaggle datasets for Sugarcane, Wheat, Rice",
        "supported_crops": ["Sugarcane", "Wheat", "Rice"],
        "num_disease_classes": 18,
        "accuracy": "TBD after retraining",
        "input_size": "224x224",
        "framework": "PyTorch",
        "note": "Use /download-three-crop-datasets to refresh training data",
        "model_loaded": detector is not None,
    }


@app.post("/download-three-crop-datasets")
async def download_three_crop_datasets_endpoint():
    """Download and prepare the 3 datasets for Sugarcane, Wheat, Rice."""
    try:
        raw = download_three_crop_datasets()
        prepared = prepare_three_crop_dataset(raw_root="data/raw_three_crops", out_root="data/filtered_three_crops")
        return {"status": "success", "raw": raw, "prepared": prepared}
    except Exception as e:
        logger.error(f"Failed to fetch datasets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/download-dataset")
async def download_dataset():
    """Backward compatible endpoint for PlantVillage dataset download."""
    try:
        path = fetch_plant_village()
        return {"status": "success", "path": path}
    except Exception as e:
        logger.error(f"Failed to fetch dataset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "Smart Farmer AI - Plant Disease Detection",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict (POST)",
            "batch_predict": "/batch-predict (POST)",
            "model_info": "/model-info",
            "auth_register": "/auth/register (POST)",
            "auth_login": "/auth/login (POST)",
            "auth_overview": "/auth/overview",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import sys

    # allow quick dataset download from command line
    if len(sys.argv) > 1 and sys.argv[1] == "--download-data":
        print("Downloading and preparing three-crop datasets before starting API...")
        try:
            download_three_crop_datasets()
            prepare_three_crop_dataset(raw_root="data/raw_three_crops", out_root="data/filtered_three_crops")
        except Exception as e:
            print(f"Error downloading dataset: {e}")
            sys.exit(1)

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
