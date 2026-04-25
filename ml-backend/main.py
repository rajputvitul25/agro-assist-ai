import os
from threading import Lock
from typing import Any, Dict, List, Literal, Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from auth_store import (
    ensure_admin_user,
    ensure_demo_user,
    get_auth_overview,
    initialize_auth_db,
    login_user,
    register_user,
)
from download_dataset import download_three_crop_datasets, prepare_three_crop_dataset
from model import PlantDiseaseDetector
from chatbot_engine import FarmChatbotEngine


app = FastAPI(
    title="Smart Farming Assistant Crop Monitoring API",
    description="Crop monitoring backend for Sugarcane, Wheat, and Rice disease analysis",
    version="2.0.0",
)

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


def _default_model_path() -> Optional[str]:
    backend_dir = os.path.dirname(__file__)
    preferred = os.path.join(backend_dir, "three_crop_model.pth")
    legacy = os.path.join(backend_dir, "model.pth")
    if os.path.isfile(preferred):
        return preferred
    if os.path.isfile(legacy):
        return legacy
    return None


resolved_model_path = os.getenv("MODEL_WEIGHTS") or _default_model_path()
detector: Optional[PlantDiseaseDetector] = None
detector_lock = Lock()
chatbot_engine = FarmChatbotEngine()


def get_detector() -> PlantDiseaseDetector:
    global detector
    if detector is not None:
        return detector

    with detector_lock:
        if detector is not None:
            return detector
        detector = PlantDiseaseDetector(model_path=resolved_model_path)
        return detector


def reset_detector():
    global detector
    with detector_lock:
        detector = None


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


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str
    topic: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    language: Literal["en", "hi"] = "en"
    history: List[ChatHistoryMessage] = Field(default_factory=list)


class ChatAction(BaseModel):
    label: str
    route: Optional[str] = None
    message: Optional[str] = None
    url: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    language: Literal["en", "hi"]
    topic: str
    suggestions: List[str]
    actions: List[ChatAction]


@app.get("/health", response_model=HealthCheck)
async def health_check():
    return {
        "status": "healthy",
        "message": "Crop monitoring backend is running",
    }


@app.post("/auth/register", response_model=AuthResponse)
async def register(request: AuthRegisterRequest) -> AuthResponse:
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user = register_user(name=request.name, email=request.email, password=request.password)
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


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        result = chatbot_engine.respond(
            message=request.message,
            language=request.language,
            history=[entry.model_dump() for entry in request.history],
        )
        return ChatResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Chat error: {exc}")


@app.post("/predict", response_model=PredictionResponse)
async def predict_disease(
    file: UploadFile = File(...),
    crop_hint: Optional[str] = Form(None),
) -> PredictionResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_data = await file.read()
    if not image_data:
        raise HTTPException(status_code=400, detail="Empty image file")

    result = get_detector().predict(image_data, crop_hint=crop_hint)
    if "error" in result:
        raise HTTPException(status_code=500, detail=f"Prediction error: {result['error']}")
    return PredictionResponse(**result)


@app.post("/batch-predict")
async def batch_predict(files: List[UploadFile] = File(...), crop_hint: Optional[str] = Form(None)):
    predictions = []
    detector_instance = get_detector()

    for uploaded_file in files:
        try:
            image_data = await uploaded_file.read()
            result = detector_instance.predict(image_data, crop_hint=crop_hint)
            if "error" in result:
                predictions.append({"filename": uploaded_file.filename, "error": result["error"]})
            else:
                predictions.append({"filename": uploaded_file.filename, "prediction": result})
        except Exception as exc:
            predictions.append({"filename": uploaded_file.filename, "error": str(exc)})

    return predictions


@app.get("/model-info")
async def model_info():
    detector_instance = get_detector()
    metadata = detector_instance.metadata
    training_summary = metadata.get("training_summary", {})
    class_map = metadata.get("class_map", {})

    supported_diseases: Dict[str, List[str]] = {}
    for value in class_map.values():
        crop, disease = value
        supported_diseases.setdefault(crop, []).append(disease)

    return {
        "model_name": "Three Crop Leaf Classifier",
        "version": metadata.get("version", "unknown"),
        "architecture": metadata.get("architecture", "unknown"),
        "model_path": resolved_model_path,
        "input_size": metadata.get("image_size", 224),
        "supported_crops": metadata.get("supported_crops", ["Sugarcane", "Wheat", "Rice"]),
        "supported_diseases": {
            crop: sorted(diseases) for crop, diseases in sorted(supported_diseases.items())
        },
        "num_classes": len(class_map),
        "validation_accuracy": training_summary.get("validation_accuracy"),
        "per_crop_accuracy": training_summary.get("per_crop_accuracy", {}),
        "class_counts": training_summary.get("class_counts", {}),
        "sources": metadata.get("sources", []),
        "model_loaded": detector is not None,
    }


@app.post("/download-three-crop-datasets")
async def download_three_crop_datasets_endpoint():
    try:
        downloaded = download_three_crop_datasets(dest_root="data/source_archives")
        prepared = prepare_three_crop_dataset(archive_root="data/source_archives", out_root="data/three_crop_dataset")
        return {"status": "success", "downloaded": downloaded, "prepared": prepared}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/")
async def root():
    return {
        "name": "Smart Farming Assistant Crop Monitoring API",
        "version": "2.0.0",
        "supported_crops": ["Sugarcane", "Wheat", "Rice"],
        "endpoints": {
            "health": "/health",
            "chat": "/chat",
            "predict": "/predict",
            "batch_predict": "/batch-predict",
            "model_info": "/model-info",
            "download_three_crop_datasets": "/download-three-crop-datasets",
            "docs": "/docs",
        },
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run the crop monitoring backend")
    parser.add_argument("--download-data", action="store_true", help="Download and prepare datasets before starting")
    args = parser.parse_args()

    if args.download_data:
        download_three_crop_datasets(dest_root="data/source_archives")
        prepare_three_crop_dataset(archive_root="data/source_archives", out_root="data/three_crop_dataset")

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, log_level="info")
