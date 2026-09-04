from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base

# Import all models to ensure they are registered with Base.metadata before creating tables
from .models.customer import Customer
from .models.transaction import Transaction
from .models.recovery import RecoveryOpportunity, RecoveryAction
from .models.audit import AuditLog

from .routes import dashboard, transactions, recovery, analytics, audit, opportunities, customers

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "RecoverIQ API"
    }

app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
app.include_router(transactions.router, prefix=f"{settings.API_V1_STR}/transactions", tags=["Transactions"])
app.include_router(opportunities.router, prefix=f"{settings.API_V1_STR}/opportunities", tags=["Opportunities"])
app.include_router(recovery.router, prefix=f"{settings.API_V1_STR}/recovery", tags=["Recovery"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit"])
app.include_router(customers.router, prefix=f"{settings.API_V1_STR}/customers", tags=["Customers"])
