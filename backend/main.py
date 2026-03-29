from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routes import auth_routes, users, jobs, offers, ai

# Create DB tables handled by Alembic

app = FastAPI(
    title="Domestic App API",
    description="Temizlik hizmeti platformu için RESTful backend.",
    version="1.0.0"
)

# CORS middleware config
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    # React and Mobile clients can go here
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Includes Routers
app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(offers.router, prefix="/api/v1/offers", tags=["offers"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Domestic API!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
