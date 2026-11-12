import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from authlib.integrations.base_client.errors import OAuthError
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pwdlib import PasswordHash
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.sessions import SessionMiddleware

from app.auth import exchange_auth_code, get_current_user, get_db, make_auth_code
from app.config import get_settings
from app.email_service import EmailDeliveryError, send_email
from app.models import AuthCode, EmailActionToken, LearningActivity, LearningProgress, User
from app.oauth import create_oauth
from app.schemas import (
    AuthCodeExchange,
    EmailAddressRequest,
    EmailLogin,
    EmailRegistration,
    EmailTokenRequest,
    PasswordResetRequest,
    ProgressUpdate,
    UserResponse,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()
oauth = create_oauth()
password_hasher = PasswordHash.recommended()
dummy_password_hash = password_hasher.hash(secrets.token_urlsafe(32))
app = FastAPI(title="ZSYSPRO HUB API", version="0.1.0")
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.session_secret,
    same_site="lax",
    https_only=settings.app_env.casefold() == "production",
    max_age=600,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

if settings.app_env.casefold() == "production":
    if len(settings.jwt_secret) < 32 or settings.jwt_secret.startswith("development-only"):
        raise RuntimeError("JWT_SECRET must be a unique, random value of at least 32 characters in production.")
    if len(settings.session_secret) < 32 or settings.session_secret.startswith("development-only"):
        raise RuntimeError("SESSION_SECRET must be a unique, random value of at least 32 characters in production.")
    if settings.jwt_secret == settings.session_secret:
        raise RuntimeError("JWT_SECRET and SESSION_SECRET must be different values.")
    if not settings.frontend_url.startswith("https://"):
        raise RuntimeError("FRONTEND_URL must use HTTPS in production.")
    if (
        settings.google_client_id
        and settings.google_client_secret
        and not settings.backend_url.startswith("https://")
    ):
        raise RuntimeError("BACKEND_URL must use HTTPS when Google sign-in is enabled.")
    if (
        settings.email_password_enabled
        and not settings.smtp_use_ssl
        and not settings.smtp_starttls
    ):
        raise RuntimeError("SMTP must use SSL or STARTTLS in production.")

COURSES = [
    {"slug": "jcl-fundamentals", "title": "JCL Fundamentals", "description": "Build and understand your first batch jobs.", "minutes": 18},
    {"slug": "jes2-essentials", "title": "Understanding JES2", "description": "Learn the z/OS job entry subsystem.", "minutes": 26},
    {"slug": "tso-ispf", "title": "TSO/ISPF Essentials", "description": "Navigate the core interactive z/OS environment.", "minutes": 34},
]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/ready")
async def ready(db: AsyncSession = Depends(get_db)):
    await db.execute(select(1))
    return {"status": "ready"}


@app.get("/auth/providers")
async def auth_providers():
    return {
        "google": bool(settings.google_client_id and settings.google_client_secret),
        "microsoft": bool(settings.microsoft_client_id and settings.microsoft_client_secret),
        "email_password": settings.email_password_enabled,
    }


def _normalized_email(email: str) -> str:
    return email.strip().casefold()


def _token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _email_link(path: str, token: str) -> str:
    return f"{settings.frontend_url.rstrip('/')}/{path}?token={token}"


async def _create_email_action_token(
    db: AsyncSession, user: User, purpose: str, lifetime: timedelta
) -> str | None:
    now = datetime.now(timezone.utc)
    latest = await db.scalar(
        select(EmailActionToken)
        .where(EmailActionToken.user_id == user.id, EmailActionToken.purpose == purpose)
        .order_by(EmailActionToken.created_at.desc())
        .limit(1)
    )
    if latest is not None:
        created_at = latest.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if created_at > now - timedelta(seconds=60):
            return None

    token = secrets.token_urlsafe(40)
    await db.execute(
        delete(EmailActionToken).where(
            EmailActionToken.user_id == user.id,
            EmailActionToken.purpose == purpose,
        )
    )
    db.add(
        EmailActionToken(
            token_hash=_token_digest(token),
            user_id=user.id,
            purpose=purpose,
            expires_at=now + lifetime,
        )
    )
    await db.commit()
    return token


async def _consume_email_action_token(
    db: AsyncSession, token: str, purpose: str
) -> User:
    record = await db.scalar(
        select(EmailActionToken)
        .where(
            EmailActionToken.token_hash == _token_digest(token),
            EmailActionToken.purpose == purpose,
        )
        .with_for_update()
    )
    if record is None:
        raise HTTPException(status_code=400, detail="This link is invalid or has expired.")
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        await db.delete(record)
        await db.commit()
        raise HTTPException(status_code=400, detail="This link is invalid or has expired.")
    user = await db.get(User, record.user_id)
    await db.delete(record)
    if user is None:
        await db.commit()
        raise HTTPException(status_code=400, detail="This link is invalid or has expired.")
    return user


async def _deliver_action_email(recipient: str, subject: str, body: str) -> None:
    try:
        await send_email(recipient, subject, body)
    except EmailDeliveryError as exc:
        logger.error("Account email delivery failed: %s", exc.__class__.__name__)
        raise HTTPException(
            status_code=503,
            detail="The email could not be sent. Please try again later or contact the site owner.",
        ) from exc


async def _send_verification_email(user: User, token: str) -> None:
    link = _email_link("api/auth/email/verify", token)
    await _deliver_action_email(
        user.email or "",
        "Verify your ZSYSPRO HUB account",
        f"Hello {user.full_name},\n\nVerify your email address using this link (valid for 24 hours):\n{link}\n\nIf you did not create this account, you can ignore this message.",
    )


@app.post("/auth/email/register", status_code=status.HTTP_202_ACCEPTED)
async def register_email_account(
    payload: EmailRegistration, db: AsyncSession = Depends(get_db)
):
    if not settings.email_password_enabled:
        raise HTTPException(status_code=503, detail="Email account creation is not configured.")
    if not payload.full_name.strip():
        raise HTTPException(status_code=422, detail="Enter your name.")

    email = _normalized_email(str(payload.email))
    existing = await db.scalar(select(User.id).where(func.lower(User.email) == email))
    if existing is not None:
        return {"message": "If this address can be registered, a verification email will be sent."}

    user = User(
        provider="password",
        provider_subject=email,
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=password_hasher.hash(payload.password),
        email_verified=False,
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        return {"message": "If this address can be registered, a verification email will be sent."}

    token = await _create_email_action_token(
        db, user, "verify_email", timedelta(hours=24)
    )
    if token is None:
        raise HTTPException(status_code=429, detail="Please wait before requesting another email.")
    await _send_verification_email(user, token)
    return {"message": "If this address can be registered, a verification email will be sent."}


@app.post("/auth/email/login")
async def login_with_email(
    payload: EmailLogin, db: AsyncSession = Depends(get_db)
):
    email = _normalized_email(str(payload.email))
    user = await db.scalar(
        select(User).where(
            User.provider == "password",
            User.provider_subject == email,
        )
    )
    password_hash = user.password_hash if user and user.password_hash else dummy_password_hash
    if not password_hasher.verify(payload.password, password_hash) or user is None:
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Verify your email before signing in.")
    code = await make_auth_code(db, user)
    return {"code": code}


@app.post("/auth/email/resend-verification", status_code=status.HTTP_202_ACCEPTED)
async def resend_email_verification(
    payload: EmailAddressRequest, db: AsyncSession = Depends(get_db)
):
    if not settings.email_password_enabled:
        raise HTTPException(status_code=503, detail="Email account creation is not configured.")
    email = _normalized_email(str(payload.email))
    user = await db.scalar(
        select(User).where(User.provider == "password", User.provider_subject == email)
    )
    if user is not None and not user.email_verified:
        token = await _create_email_action_token(
            db, user, "verify_email", timedelta(hours=24)
        )
        if token is not None:
            await _send_verification_email(user, token)
    return {"message": "If the account needs verification, an email will be sent."}


@app.post("/auth/email/verify")
async def verify_email_address(
    payload: EmailTokenRequest, db: AsyncSession = Depends(get_db)
):
    user = await _consume_email_action_token(db, payload.token, "verify_email")
    user.email_verified = True
    await db.execute(
        delete(EmailActionToken).where(
            EmailActionToken.user_id == user.id,
            EmailActionToken.purpose == "verify_email",
        )
    )
    await db.commit()
    return {"verified": True}


@app.post("/auth/password/forgot", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    payload: EmailAddressRequest, db: AsyncSession = Depends(get_db)
):
    if not settings.email_password_enabled:
        raise HTTPException(status_code=503, detail="Email account services are not configured.")
    email = _normalized_email(str(payload.email))
    user = await db.scalar(
        select(User).where(
            User.provider == "password",
            User.provider_subject == email,
            User.email_verified.is_(True),
        )
    )
    if user is not None:
        token = await _create_email_action_token(
            db, user, "reset_password", timedelta(minutes=30)
        )
        if token is not None:
            link = _email_link("reset-password", token)
            await _deliver_action_email(
                email,
                "Reset your ZSYSPRO HUB password",
                f"Hello {user.full_name},\n\nReset your password using this link (valid for 30 minutes):\n{link}\n\nIf you did not request a reset, you can ignore this message.",
            )
    return {"message": "If a verified account exists for this address, a reset email will be sent."}


@app.post("/auth/password/reset")
async def reset_password(
    payload: PasswordResetRequest, db: AsyncSession = Depends(get_db)
):
    user = await _consume_email_action_token(db, payload.token, "reset_password")
    user.password_hash = password_hasher.hash(payload.password)
    user.token_version += 1
    await db.execute(
        delete(EmailActionToken).where(EmailActionToken.user_id == user.id)
    )
    await db.execute(delete(AuthCode).where(AuthCode.user_id == user.id))
    await db.commit()
    return {"reset": True}


@app.get("/auth/{provider}/login")
async def login(provider: str, request: Request):
    if provider not in {"google", "microsoft"}:
        raise HTTPException(status_code=404, detail="Unsupported sign-in provider.")
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(status_code=503, detail=f"{provider.title()} sign-in is not configured.")
    callback = f"{settings.backend_url.rstrip('/')}/auth/{provider}/callback"
    return await client.authorize_redirect(request, callback)


@app.get("/auth/{provider}/callback")
async def oauth_callback(provider: str, request: Request, db: AsyncSession = Depends(get_db)):
    if provider not in {"google", "microsoft"}:
        raise HTTPException(status_code=404, detail="Unsupported sign-in provider.")
    client = oauth.create_client(provider)
    if client is None:
        raise HTTPException(status_code=503, detail=f"{provider.title()} sign-in is not configured.")
    try:
        token = await client.authorize_access_token(request)
    except OAuthError as exc:
        logger.warning("OAuth callback failed for provider %s: %s", provider, exc.error)
        raise HTTPException(status_code=401, detail="Sign-in could not be verified. Please try again.") from exc
    userinfo = token.get("userinfo")
    if not userinfo:
        userinfo = await client.userinfo(token=token)
    subject = userinfo.get("sub")
    if not subject:
        raise HTTPException(status_code=401, detail="Provider did not return a verified account ID.")
    email = userinfo.get("email") or userinfo.get("preferred_username")
    full_name = userinfo.get("name") or (email.split("@")[0] if email else "ZSYSPRO member")
    user = await db.scalar(
        select(User).where(User.provider == provider, User.provider_subject == str(subject))
    )
    if user is None and email:
        password_account = await db.scalar(
            select(User.id).where(
                User.provider == "password",
                func.lower(User.email) == _normalized_email(str(email)),
            )
        )
        if password_account is not None:
            raise HTTPException(
                status_code=409,
                detail="This email already has a password account. Sign in with email and password.",
            )
    if user is None:
        user = User(
            provider=provider,
            provider_subject=str(subject),
            email=email,
            full_name=str(full_name)[:160],
            avatar_url=userinfo.get("picture"),
            email_verified=bool(userinfo.get("email_verified", True)),
        )
        db.add(user)
        await db.flush()
    else:
        user.email = email
        user.full_name = str(full_name)[:160]
        user.avatar_url = userinfo.get("picture")
    await db.execute(delete(AuthCode).where(AuthCode.expires_at <= datetime.now(timezone.utc)))
    code = await make_auth_code(db, user)
    callback = f"{settings.frontend_url.rstrip('/')}/api/auth/callback?{urlencode({'code': code})}"
    return RedirectResponse(callback, status_code=status.HTTP_303_SEE_OTHER)


@app.post("/auth/exchange")
async def exchange_code(payload: AuthCodeExchange, db: AsyncSession = Depends(get_db)):
    token = await exchange_auth_code(payload.code, db)
    return {"access_token": token, "token_type": "bearer", "expires_in": settings.jwt_ttl_minutes * 60}


@app.get("/api/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user


@app.delete("/api/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.delete(user)
    await db.commit()
    return None


@app.get("/api/dashboard")
async def get_dashboard(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    progress_rows = list(
        await db.scalars(select(LearningProgress).where(LearningProgress.user_id == user.id))
    )
    progress = {row.course_slug: row.percent_complete for row in progress_rows}
    activities = list(
        await db.scalars(
            select(LearningActivity)
            .where(
                LearningActivity.user_id == user.id,
                LearningActivity.created_at >= datetime.now(timezone.utc) - timedelta(days=6),
            )
            .order_by(LearningActivity.created_at)
        )
    )
    chart = {}
    for day_offset in range(6, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=day_offset)).date()
        chart[day.isoformat()] = {"day": day.strftime("%a"), "learning": 0}
    for activity in activities:
        timestamp = activity.created_at
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        key = timestamp.date().isoformat()
        if key in chart:
            chart[key]["learning"] += 1
    modules_completed = sum(1 for percent in progress.values() if percent == 100)
    courses = [
        {**course, "percent_complete": progress.get(course["slug"], 0)}
        for course in COURSES
    ]
    progress_average = round(sum(course["percent_complete"] for course in courses) / len(courses))
    return {
        "user": UserResponse.model_validate(user).model_dump(),
        "stats": {
            "learning_progress_percent": progress_average,
            "modules_completed": modules_completed,
            "knowledge_points": modules_completed * 100,
            "courses_count": len(courses),
        },
        "courses": courses,
        "activity": list(chart.values()),
        "system_integrations": {"zos_connected": False},
    }


@app.put("/api/learning/{course_slug}")
async def update_learning_progress(
    course_slug: str,
    payload: ProgressUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if course_slug not in {course["slug"] for course in COURSES}:
        raise HTTPException(status_code=404, detail="Learning module not found.")
    row = await db.scalar(
        select(LearningProgress).where(
            LearningProgress.user_id == user.id,
            LearningProgress.course_slug == course_slug,
        )
    )
    if row is None:
        row = LearningProgress(
            user_id=user.id,
            course_slug=course_slug,
            percent_complete=payload.percent_complete,
        )
        db.add(row)
    else:
        row.percent_complete = payload.percent_complete
    db.add(
        LearningActivity(
            user_id=user.id,
            course_slug=course_slug,
            percent_complete=payload.percent_complete,
        )
    )
    await db.commit()
    return {"course_slug": course_slug, "percent_complete": payload.percent_complete}
