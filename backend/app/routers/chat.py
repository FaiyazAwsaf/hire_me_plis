from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["chat"])

_NI = {"status": "not_implemented"}


@router.get("/history")
async def chat_history():
    return _NI
