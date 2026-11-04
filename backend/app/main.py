import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from authlib.integrations.base_client.errors import OAuthError
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.sessions import SessionMiddleware

from app.auth import exchange_auth_code, get_current_user, get_db, make_auth_code
from app.config import get_settings
from app.models import AuthCode, LearningActivity, LearningProgress, User
from app.oauth import create_oauth
from app.schemas import AuthCodeExchange, ProgressUpdate, UserResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()
oauth = create_oauth()
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
    }


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
    if user is None:
        user = User(
            provider=provider,
            provider_subject=str(subject),
            email=email,
            full_name=str(full_name)[:160],
            avatar_url=userinfo.get("picture"),
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
