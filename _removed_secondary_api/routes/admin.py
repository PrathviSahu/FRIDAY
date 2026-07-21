from fastapi import APIRouter

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/")
def admin_index():
    return {"message": "Admin router is available."}
