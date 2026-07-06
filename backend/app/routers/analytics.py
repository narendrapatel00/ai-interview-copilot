from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import models
from app.database.session import get_db
from app.routers.auth import get_current_user
from datetime import datetime, timedelta
from typing import List, Dict, Any

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Total interviews completed
    total_interviews = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).count()
    
    # Average score
    avg_score_query = db.query(func.avg(models.InterviewSession.overall_score)).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).scalar()
    avg_score = round(avg_score_query, 1) if avg_score_query is not None else 0.0
    
    # Best score
    best_score_query = db.query(func.max(models.InterviewSession.overall_score)).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).scalar()
    best_score = round(best_score_query, 1) if best_score_query is not None else 0.0
    
    # Badges
    badges = db.query(models.Badge).filter(models.Badge.user_id == current_user.id).all()
    badge_list = [{"name": b.name, "description": b.description, "icon": b.icon, "unlocked_at": b.unlocked_at} for b in badges]
    
    # Recent sessions
    recent_sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id
    ).order_by(models.InterviewSession.created_at.desc()).limit(5).all()
    
    recent_activity = []
    for s in recent_sessions:
        recent_activity.append({
            "id": s.id,
            "role": s.role,
            "difficulty": s.difficulty,
            "overall_score": s.overall_score,
            "status": s.status,
            "created_at": s.created_at
        })
        
    # Category Performance Averages
    cat_averages = db.query(
        func.avg(models.InterviewSession.technical_score),
        func.avg(models.InterviewSession.communication_score),
        func.avg(models.InterviewSession.confidence_score),
        func.avg(models.InterviewSession.problem_solving_score)
    ).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewSession.status == "completed"
    ).first()
    
    category_scores = {
        "technical": round(cat_averages[0], 1) if cat_averages and cat_averages[0] is not None else 0.0,
        "communication": round(cat_averages[1], 1) if cat_averages and cat_averages[1] is not None else 0.0,
        "confidence": round(cat_averages[2], 1) if cat_averages and cat_averages[2] is not None else 0.0,
        "problem_solving": round(cat_averages[3], 1) if cat_averages and cat_averages[3] is not None else 0.0,
    }
    
    # Weekly progress graph points (past 7 days)
    weekly_progress = []
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        # count completed on this day
        count = db.query(models.InterviewSession).filter(
            models.InterviewSession.user_id == current_user.id,
            models.InterviewSession.status == "completed",
            models.InterviewSession.created_at.between(day_start, day_end)
        ).count()
        
        # average score on this day
        score_val = db.query(func.avg(models.InterviewSession.overall_score)).filter(
            models.InterviewSession.user_id == current_user.id,
            models.InterviewSession.status == "completed",
            models.InterviewSession.created_at.between(day_start, day_end)
        ).scalar()
        
        weekly_progress.append({
            "day": day.strftime("%a"),
            "count": count,
            "average_score": round(score_val, 1) if score_val is not None else 0.0
        })

    # Bookmark summary
    bookmarked_questions = db.query(models.InterviewQuestion).join(
        models.InterviewSession
    ).filter(
        models.InterviewSession.user_id == current_user.id,
        models.InterviewQuestion.bookmarked == True
    ).limit(10).all()
    
    bookmarks = [{
        "id": b.id,
        "question_text": b.question_text,
        "category": b.category,
        "session_id": b.session_id,
        "role": b.session.role
    } for b in bookmarked_questions]
    
    return {
        "total_interviews": total_interviews,
        "average_score": avg_score,
        "best_score": best_score,
        "xp": current_user.xp,
        "level": current_user.level,
        "streak": current_user.streak,
        "recent_activity": recent_activity,
        "category_scores": category_scores,
        "weekly_progress": weekly_progress,
        "badges": badge_list,
        "bookmarks": bookmarks
    }

@router.get("/leaderboard")
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Fetch top 10 users by XP
    top_users = db.query(models.User).order_by(models.User.xp.desc()).limit(10).all()
    
    leaderboard = []
    for rank, u in enumerate(top_users, 1):
        leaderboard.append({
            "rank": rank,
            "username": u.full_name,
            "xp": u.xp,
            "level": u.level,
            "streak": u.streak,
            "is_self": u.id == current_user.id
        })
        
    return leaderboard
