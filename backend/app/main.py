import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_router
from app.models.case import ApplicationCase
from app.services.seed import seed_demo_database

# Configure logging without leaking document bodies
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aicte-veritas")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # If demo mode and no cases exist, automatically seed synthetic demo cases
    db = SessionLocal()
    try:
        case_count = db.query(ApplicationCase).count()
        if case_count == 0 and settings.DEMO_MODE:
            logger.info("Database is empty. Seeding initial synthetic demonstration cases...")
            seed_demo_database(db)
    except Exception as e:
        logger.error(f"Error during startup data initialization: {e}")
    finally:
        db.close()

    yield
    # Shutdown
    logger.info("Shutting down AICTE Veritas backend...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SIH26261: AI-Powered Application Validation, Document Authentication and Regulatory Compliance Assistance (Stage 1 Foundation)",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix="/api")

@app.get("/api/v1/health", tags=["system"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "demo_mode": settings.DEMO_MODE,
        "database": "sqlite_connected" if settings.DATABASE_URL.startswith("sqlite") else "postgres_connected"
    }

@app.get("/", tags=["system"])
def root_info():
    return {
        "service": settings.APP_NAME,
        "problem_statement": "SIH26261",
        "version": settings.APP_VERSION,
        "documentation": "/docs",
        "demo_notice": "Institutional application validation prototype. Synthetic records only."
    }
