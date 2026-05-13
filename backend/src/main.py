"""
main.py
=======
FastAPI application entry point for the Mancrel backend.

Start the server with:
    cd backend
    uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

What this file does:
  1. Loads environment variables from backend/.env before anything else.
  2. Creates the FastAPI app instance with metadata (used by Swagger UI).
  3. Registers CORS middleware so the Next.js frontend can call the API.
  4. Mounts all versioned routers under /api/v1/...
  5. Adds a /health endpoint for uptime monitoring and deployment checks.

Why load .env here and not in each module?
  Loading once at startup guarantees that os.environ is fully populated
  before any module that reads env vars is imported.  If you load inside
  a module, you risk importing that module before load_dotenv() runs and
  getting empty strings or KeyErrors.

Why CORS?
  Browsers enforce the Same-Origin Policy: a page served from
  https://mancrel.vercel.app is not allowed to fetch from
  https://mancrel-api.up.railway.app unless the API explicitly says it's
  okay.  The CORS middleware adds the right response headers to do that.

Why versioned routers (/api/v1/...)?
  When you need to make a breaking change to an endpoint, you can add /v2
  without removing /v1.  Existing clients keep working while new clients
  use the updated API.  This is critical once real businesses depend on it.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

# ── 1. Load .env before importing anything that reads env vars ────────────────
# backend/.env lives one directory above backend/src/, so we go up twice
# from this file (backend/src/main.py → backend/src/ → backend/).
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(_env_path)
    print(f"[startup] Loaded env from {_env_path}")
else:
    print(f"[startup] WARNING: No .env found at {_env_path}. Relying on system env.")

# ── 2. Standard library / framework imports (after env is loaded) ─────────────
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── 3. Internal router imports ────────────────────────────────────────────────
from api.v1.messaging.routes import router as messaging_router

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── 4. App instance ───────────────────────────────────────────────────────────
app = FastAPI(
    title="Mancrel API",
    description=(
        "AI-powered CRM backend for Mancrel. "
        "Handles WhatsApp message classification and reply generation via OpenRouter."
    ),
    version="0.1.0",
    # Swagger UI lives at /docs  — useful during development.
    # Disable in production by passing docs_url=None, redoc_url=None.
    docs_url="/docs",
    redoc_url="/redoc",
)


# ── 5. CORS ───────────────────────────────────────────────────────────────────
# allow_origins controls which frontend origins can call this API.
# During development "*" (all origins) is convenient.
# In production, replace with your exact frontend URL(s):
#   ["https://mancrel.vercel.app", "https://mancrel.com"]
_cors_origins_raw = os.environ.get("CORS_ALLOWED_ORIGINS", "*")
_cors_origins = (
    ["*"]
    if _cors_origins_raw == "*"
    else [o.strip() for o in _cors_origins_raw.split(",")]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    # Which HTTP methods the browser is allowed to send.
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    # Which request headers the browser is allowed to include.
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


# ── 6. Routers ────────────────────────────────────────────────────────────────
# prefix="/api/v1" + router prefix="/messaging" → /api/v1/messaging/...
app.include_router(messaging_router, prefix="/api/v1")

# Future routers will be added here:
# from api.v1.auth.routes import router as auth_router
# app.include_router(auth_router, prefix="/api/v1")
#
# from api.v1.customers.routes import router as customers_router
# app.include_router(customers_router, prefix="/api/v1")


# ── 7. Health check ───────────────────────────────────────────────────────────
@app.get(
    "/health",
    tags=["Health"],
    summary="Health check",
    description=(
        "Returns 200 OK when the server is running.  "
        "Used by Railway/Render/load-balancers to know the app is alive."
    ),
)
async def health_check() -> dict:
    return {
        "status": "ok",
        "version": app.version,
        "env": os.environ.get("ENVIRONMENT", "development"),
    }


# ── 8. Startup / shutdown lifecycle hooks ─────────────────────────────────────
@app.on_event("startup")
async def on_startup() -> None:
    """
    Runs once when the server starts, before handling any requests.
    Good place to:
      - Verify required env vars are set
      - Open DB connection pools
      - Pre-load heavy models into memory
    """
    required = ["OPENROUTER_API_KEY"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        logger.warning(
            "[startup] Missing env vars: %s — some endpoints will return 503",
            ", ".join(missing),
        )
    else:
        logger.info("[startup] All required env vars present ✓")

    logger.info(
        "[startup] Mancrel API v%s started. Docs: http://localhost:8000/docs",
        app.version,
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Runs when the server is shutting down. Clean up resources here."""
    logger.info("[shutdown] Mancrel API shutting down.")
