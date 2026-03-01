from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path
from PIL import Image
from transformers import pipeline as hf_pipeline
import sys, os, logging, json, io
from datetime import datetime

# ── Path setup ────────────────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent.parent))
from model.predict import predict

# ── Request logger ─────────────────────────────────────────────────────────────
LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "requests.jsonl"

_req_logger = logging.getLogger("request_logger")
_req_logger.setLevel(logging.INFO)
_fh = logging.FileHandler(str(LOG_FILE), encoding="utf-8")
_fh.setFormatter(logging.Formatter("%(message)s"))
_req_logger.addHandler(_fh)


def log_request(ip: str, filename: str, content_type: str, result: dict):
    record = {
        "timestamp":          datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "ip":                 ip,
        "filename":           filename,
        "content_type":       content_type,
        "diagnosis":          result.get("diagnosis"),
        "probability":        result.get("probability"),
        "confidence_warning": result.get("confidence_warning"),
    }
    _req_logger.info(json.dumps(record))


# ── NSFW classifier ────────────────────────────────────────────────────────────
_nsfw_classifier = None


def get_nsfw_classifier():
    global _nsfw_classifier
    if _nsfw_classifier is None:
        _nsfw_classifier = hf_pipeline(
            "image-classification",
            model="Falconsai/nsfw_image_detection",
            framework="pt",   # Force PyTorch — avoids Keras 3 conflict with TF backend
        )
    return _nsfw_classifier


def is_nsfw(image_bytes: bytes, threshold: float = 0.60) -> bool:
    """Return True if the image is detected as NSFW above the threshold."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = get_nsfw_classifier()(img)
    # results: [{"label": "normal"|"nsfw", "score": float}, ...]
    for item in results:
        if item["label"] == "nsfw" and item["score"] >= threshold:
            return True
    return False


# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Pneumonia Detector API",
    description="DenseNet-121 chest X-ray binary classifier with Grad-CAM explainability.",
    version="1.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the frontend
frontend_dir = Path(__file__).parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return FileResponse(str(frontend_dir / "index.html"))


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/predict")
@limiter.limit("10/minute")
async def predict_endpoint(request: Request, file: UploadFile = File(...)):
    # ── Validate file type ─────────────────────────────────────────────────────
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(
            status_code=400,
            detail="Only JPEG and PNG images are supported.",
        )

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    # ── NSFW guard ─────────────────────────────────────────────────────────────
    try:
        if is_nsfw(image_bytes):
            raise HTTPException(
                status_code=400,
                detail="Inappropriate content detected. Please upload a chest X-ray.",
            )
    except HTTPException:
        raise
    except Exception as e:
        # Fail-closed: if the classifier errors, block the request
        raise HTTPException(
            status_code=503,
            detail=f"Content moderation unavailable: {str(e)}",
        )

    # ── Inference ──────────────────────────────────────────────────────────────
    try:
        result = predict(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

    # ── Log request ────────────────────────────────────────────────────────────
    client_ip = get_remote_address(request)
    log_request(
        ip=client_ip,
        filename=file.filename or "unknown",
        content_type=file.content_type,
        result=result,
    )

    return JSONResponse(content=result)
