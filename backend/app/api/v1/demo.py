from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.seed import seed_demo_database
from app.models.case import ApplicationCase
from app.models.document import ApplicationDocument

router = APIRouter(prefix="/demo", tags=["demo"])

@router.post("/reset")
def reset_demo_environment(db: Session = Depends(get_db)):
    """
    Resets the database with synthetic demonstration records.
    """
    seed_demo_database(db)
    cases_count = db.query(ApplicationCase).count()
    docs_count = db.query(ApplicationDocument).count()
    return {
        "status": "success",
        "message": "Demo database successfully reset with synthetic cases.",
        "case_count": cases_count,
        "document_count": docs_count,
        "is_synthetic": True
    }

@router.get("/status")
def get_demo_status(db: Session = Depends(get_db)):
    cases_count = db.query(ApplicationCase).count()
    docs_count = db.query(ApplicationDocument).count()
    return {
        "environment": "demonstration",
        "demo_mode": True,
        "case_count": cases_count,
        "document_count": docs_count,
        "notice": "All data in this environment is synthetic and for SIH26261 demonstration purposes only."
    }
