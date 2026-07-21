from fastapi import APIRouter

router = APIRouter(prefix="/api/voice", tags=["voice"])

@router.get("/")
def voice_index():
    return {"message": "Voice router is available."}
