from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from ..schemas.transaction import TransactionResponse
from ..database import get_db
from ..models.transaction import Transaction

router = APIRouter()

@router.get("", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).all()

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn
