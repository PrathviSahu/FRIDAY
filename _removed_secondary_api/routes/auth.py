from fastapi import APIRouter

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.get("/")
def auth_index():
    return {"message": "Auth router is available."}
