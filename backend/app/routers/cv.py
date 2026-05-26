from fastapi import APIRouter

router = APIRouter(prefix="/cv", tags=["cv"])

_NI = {"status": "not_implemented"}


@router.post("/upload")
async def upload_cv():
    return _NI


@router.get("/status")
async def cv_status():
    return _NI


@router.get("")
async def list_cvs():
    return _NI


@router.delete("/{cv_id}")
async def delete_cv(cv_id: str):
    return _NI


@router.get("/profile")
async def get_cv_profile():
    return _NI


@router.put("/profile")
async def put_cv_profile():
    return _NI


@router.patch("/profile")
async def patch_cv_profile():
    return _NI


@router.post("/export")
async def export_cv():
    return _NI
