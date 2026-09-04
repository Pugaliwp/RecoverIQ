from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from ..schemas.recovery import RecoveryOpportunityResponse
from ..database import get_db
from ..models.recovery import RecoveryOpportunity

router = APIRouter()

@router.get("", response_model=List[RecoveryOpportunityResponse])
def get_opportunities(db: Session = Depends(get_db)):
    return db.query(RecoveryOpportunity).all()

@router.get("/{opportunity_id}", response_model=RecoveryOpportunityResponse)
def get_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    opp = db.query(RecoveryOpportunity).filter(RecoveryOpportunity.opportunity_id == opportunity_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opp
