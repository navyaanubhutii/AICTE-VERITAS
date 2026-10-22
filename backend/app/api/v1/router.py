from fastapi import APIRouter
from app.api.v1.cases import router as cases_router
from app.api.v1.documents import router as documents_router
from app.api.v1.clarifications import router as clarifications_router
from app.api.v1.observations import router as observations_router
from app.api.v1.demo import router as demo_router

api_router = APIRouter(prefix="/v1")

api_router.include_router(cases_router)
api_router.include_router(documents_router)
api_router.include_router(clarifications_router)
api_router.include_router(observations_router)
api_router.include_router(demo_router)
