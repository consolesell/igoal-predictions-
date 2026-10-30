import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, Header, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from backend.app.config import settings
from backend.app.database import engine, Base, AsyncSessionLocal
from backend.app.routers import health, fixtures, tips, results, admin, clubs, users
from backend.app.services.engine import prediction_engine
from backend.app.services.settler import settlement_worker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("igoal.backend")

# Custom key extractor: reads X-Device-ID header if available, falls back to IP address
def get_device_or_ip(request: Request) -> str:
    device_id = request.headers.get("X-Device-ID")
    if device_id:
        return f"dev_{device_id}"
    return get_remote_address(request)

# Rate limiter setup: 60 requests per minute
limiter = Limiter(
    key_func=get_device_or_ip,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"]
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    logger.info("Initializing iGoal Predictions production database tables (v2.0)...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully. System ready.")
    yield
    # Shutdown
    await engine.dispose()
    logger.info("Database connections closed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Attach state for slowapi
app.state.limiter = limiter

# Rate limit exceeded handler (HTTP 429 -> {"error": "Too Many Requests"})
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"error": "Too Many Requests"}
    )

# Standard validation error handler conforming to error response format
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error = errors[0]["msg"] if errors else "Invalid request parameters"
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": f"Invalid request: {first_error}"}
    )

# Global 500 handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error"}
    )

# CORS setup for dashboard and Android WebView previews
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /v1 prefix
app.include_router(health.router, prefix="/v1")
app.include_router(fixtures.router, prefix="/v1")
app.include_router(tips.router, prefix="/v1")
app.include_router(results.router, prefix="/v1")
app.include_router(admin.router, prefix="/v1")
app.include_router(clubs.router, prefix="/v1")
app.include_router(users.router, prefix="/v1")

# Background worker trigger routes for automated cron / cloud scheduler (protected)
@app.post("/v1/workers/engine/run", tags=["Workers"])
async def trigger_prediction_engine(authorization: str = Header(None)):
    token = authorization.split("Bearer ", 1)[1].strip() if authorization and authorization.startswith("Bearer ") else authorization
    if token not in (settings.ADMIN_TOKEN, settings.CRON_SECRET):
        raise HTTPException(status_code=403, detail={"error": "Forbidden: Invalid cron worker credentials"})

    async with AsyncSessionLocal() as session:
        created = await prediction_engine.run_worker(session)
    return {"ok": True, "created": created, "message": f"Generated {created} new prediction tips"}

@app.post("/v1/workers/settler/run", tags=["Workers"])
async def trigger_settler(authorization: str = Header(None)):
    token = authorization.split("Bearer ", 1)[1].strip() if authorization and authorization.startswith("Bearer ") else authorization
    if token not in (settings.ADMIN_TOKEN, settings.CRON_SECRET):
        raise HTTPException(status_code=403, detail={"error": "Forbidden: Invalid cron worker credentials"})

    async with AsyncSessionLocal() as session:
        settled = await settlement_worker.run_worker(session)
    return {"ok": True, "settled": settled, "message": f"Settled {settled} completed predictions"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
