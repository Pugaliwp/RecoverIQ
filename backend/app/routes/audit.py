from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from ..schemas.audit import AuditLogResponse
from ..database import get_db
from ..models.audit import AuditLog

router = APIRouter()

@router.get("", response_model=List[AuditLogResponse])
def get_audit_trail(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
