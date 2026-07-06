from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import models
from app.database.session import get_db
from app.routers.auth import get_current_admin
from typing import List, Dict, Any

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    res = []
    for u in users:
        res.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "xp": u.xp,
            "level": u.level,
            "created_at": u.created_at
        })
    return res

@router.delete("/user/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own administrative account."
        )
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    db.delete(user)
    db.commit()
    return {"message": f"Successfully deleted user account: {user.email}"}

@router.get("/system-analytics")
def get_system_analytics(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    total_users = db.query(models.User).count()
    total_resumes = db.query(models.Resume).count()
    total_sessions = db.query(models.InterviewSession).count()
    completed_sessions = db.query(models.InterviewSession).filter_by(status="completed").count()
    
    # Average score across all users
    avg_score = db.query(func.avg(models.InterviewSession.overall_score)).filter_by(status="completed").scalar()
    
    # Breakdowns
    role_breakdown = db.query(
        models.InterviewSession.role, func.count(models.InterviewSession.id)
    ).group_by(models.InterviewSession.role).all()
    
    role_stats = [{"role": r, "count": c} for r, c in role_breakdown]
    
    return {
        "total_users": total_users,
        "total_resumes": total_resumes,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "global_average_score": round(avg_score, 1) if avg_score is not None else 0.0,
        "role_distribution": role_stats
    }
