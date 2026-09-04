from pydantic import BaseModel
from datetime import datetime

class CustomerBase(BaseModel):
    customer_id: str
    name: str
    email: str

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
