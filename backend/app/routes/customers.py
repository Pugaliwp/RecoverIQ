from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.customer import Customer
from ..schemas.customer import CustomerResponse

router = APIRouter()

@router.get("", response_model=List[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.id.asc()).all()
