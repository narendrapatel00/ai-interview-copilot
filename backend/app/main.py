import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database.session import engine
from app.database import models
from app.routers import auth, resume, interview, analytics, admin, rag
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("interview_copilot")

# Create SQLite database tables if they don't exist
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database: {e}")

app = FastAPI(
    title="AI Interview Copilot API",
    description="Scalable, production-ready backend engine for AI-powered mock interviews.",
    version="1.0.0"
)

# Enable CORS for React Frontend (running on Vite dev port or deployed instance)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://vercel.com", # placeholder for Vercel
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(interview.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(rag.router)

# General Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handler caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Our engineering team has been notified."}
    )

@app.get("/health", tags=["System Diagnostics"])
def health_check():
    return {
        "status": "healthy",
        "service": "AI Interview Copilot Backend",
        "mock_mode": auth.openai_service.is_mock_mode()
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
