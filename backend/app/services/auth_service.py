from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.context import CryptContext
from starlette.exceptions import HTTPException

from app.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of the plaintext password at 12 rounds."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the stored bcrypt hash, False otherwise."""
    return _pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    """Sign and return a JWT with an exp claim appended to the given payload."""
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(days=settings.access_token_expire_days)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    """Decode a JWT and return its payload; raises HTTP 401 on any validation failure."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("sub") is None:
            raise JWTError("missing sub")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
