from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import models
from app.database.session import get_db
from app.routers.auth import get_current_user
from app.services import pdf_service, openai_service
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/resume", tags=["Resumes"])

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported for resume uploading."
        )
    
    try:
        content_bytes = await file.read()
        extracted_text = pdf_service.extract_text_from_pdf(content_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
        
    if not extracted_text or len(extracted_text.strip()) < 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Resume text content is too short or empty. Please ensure it is a text-based PDF."
        )
        
    # Analyze resume using LLM (or mock)
    analysis = openai_service.analyze_resume_with_ai(extracted_text)
    
    db_resume = models.Resume(
        user_id=current_user.id,
        filename=file.filename,
        parsed_text=extracted_text,
        ats_score=analysis.get("ats_score", 0),
        skills=analysis.get("skills", []),
        missing_skills=analysis.get("missing_skills", []),
        strengths=analysis.get("strengths", []),
        weaknesses=analysis.get("weaknesses", []),
        project_suggestions=analysis.get("project_suggestions", []),
        resume_summary=analysis.get("resume_summary", ""),
        improvement_suggestions=analysis.get("improvement_suggestions", [])
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    
    return db_resume

@router.post("/optimize/{resume_id}")
def optimize_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.id == resume_id,
        models.Resume.user_id == current_user.id
    ).first()
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found."
        )
        
    # If already optimized, return it
    if resume.optimized_summary and resume.optimized_projects:
        return {
            "id": resume.id,
            "filename": resume.filename,
            "optimized_summary": resume.optimized_summary,
            "optimized_projects": resume.optimized_projects
        }
        
    # Otherwise run optimization
    opt_data = openai_service.optimize_resume_with_ai(resume.parsed_text)
    
    resume.optimized_summary = opt_data.get("optimized_summary")
    resume.optimized_projects = opt_data.get("optimized_projects")
    db.commit()
    db.refresh(resume)
    
    return {
        "id": resume.id,
        "filename": resume.filename,
        "optimized_summary": resume.optimized_summary,
        "optimized_projects": resume.optimized_projects
    }

@router.get("/latest")
def get_latest_resume(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resume = db.query(models.Resume).filter(
        models.Resume.user_id == current_user.id
    ).order_by(models.Resume.created_at.desc()).first()
    
    if not resume:
        return {"id": None, "message": "No resumes uploaded yet."}
    return resume

@router.get("/history")
def get_resume_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    resumes = db.query(models.Resume).filter(
        models.Resume.user_id == current_user.id
    ).order_by(models.Resume.created_at.desc()).all()
    return resumes
