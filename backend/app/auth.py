import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import SessionLocal
from app.models import AuthCode, User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_db():
    async with SessionLocal() as db:
        yield db


def issue_jwt(user_id: int) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user_id), "iat": now, "exp": now + timedelta(minutes=settings.jwt_ttl_minutes)},
        settings.jwt_secret,
        algorithm="HS256",
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in required.")
    try:
        payload = jwt.decode(credentials.credentials, get_settings().jwt_secret, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session.") from exc
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account no longer exists.")
    return user


async def make_auth_code(db: AsyncSession, user: User) -> str:
    code = secrets.token_urlsafe(40)
    db.add(
        AuthCode(
            code_hash=hashlib.sha256(code.encode()).hexdigest(),
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=2),
        )
    )
    await db.commit()
    return code


async def exchange_auth_code(code: str, db: AsyncSession) -> str:
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    record = await db.scalar(select(AuthCode).where(AuthCode.code_hash == code_hash).with_for_update())
    if record is None:
        raise HTTPException(status_code=401, detail="Invalid or already-used sign-in code.")
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        await db.delete(record)
        await db.commit()
        raise HTTPException(status_code=401, detail="Sign-in code expired. Please sign in again.")
    user_id = record.user_id
    await db.delete(record)
    await db.commit()
    return issue_jwt(user_id)


