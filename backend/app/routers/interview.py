from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import models
from app.database.session import get_db
from app.routers.auth import get_current_user
from app.services import openai_service
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/interview", tags=["Interviews"])

class InterviewStartRequest(BaseModel):
    role: str
    difficulty: str
    time_limit: int = 30
    resume_id: Optional[int] = None

class AnswerSubmitRequest(BaseModel):
    question_id: int
    answer_text: str
    code_submitted: Optional[str] = None

@router.post("/start", status_code=status.HTTP_201_CREATED)
def start_interview(
    req: InterviewStartRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Fetch resume text if provided
    resume_text = None
    resume_id = req.resume_id
    
    if not resume_id:
        # Fallback to latest resume if available
        latest_resume = db.query(models.Resume).filter(
            models.Resume.user_id == current_user.id
        ).order_by(models.Resume.created_at.desc()).first()
        if latest_resume:
            resume_text = latest_resume.parsed_text
            resume_id = latest_resume.id
    else:
        resume = db.query(models.Resume).filter(
            models.Resume.id == resume_id,
            models.Resume.user_id == current_user.id
        ).first()
        if resume:
            resume_text = resume.parsed_text

    # Generate questions using AI / Mock
    try:
        raw_questions = openai_service.generate_interview_questions(
            resume_text=resume_text,
            role=req.role,
            difficulty=req.difficulty,
            num_questions=5
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )

    # Save Session
    session = models.InterviewSession(
        user_id=current_user.id,
        resume_id=resume_id,
        role=req.role,
        difficulty=req.difficulty,
        time_limit=req.time_limit,
        status="ongoing"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Save Questions
    db_questions = []
    for q in raw_questions:
        db_q = models.InterviewQuestion(
            session_id=session.id,
            question_text=q.get("question_text"),
            category=q.get("category", "technical"),
            order_index=q.get("order_index", 1),
            code_template=q.get("code_template"),
            ideal_answer=q.get("ideal_answer")
        )
        db.add(db_q)
        db_questions.append(db_q)
        
    db.commit()

    return {
        "session_id": session.id,
        "role": session.role,
        "difficulty": session.difficulty,
        "time_limit": session.time_limit,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "category": q.category,
                "order_index": q.order_index,
                "code_template": q.code_template
            } for q in db_questions
        ]
    }

@router.post("/submit-answer")
def submit_answer(
    req: AnswerSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    question = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.id == req.question_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Check if session belongs to user
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == question.session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=403, detail="Unauthorized access to this session")

    # If answer already exists, remove or overwrite
    existing_ans = db.query(models.UserAnswer).filter(
        models.UserAnswer.question_id == question.id
    ).first()
    if existing_ans:
        db.delete(existing_ans)
        db.commit()

    # Evaluate answer using OpenAI
    evaluation = openai_service.evaluate_answer_with_ai(
        question_text=question.question_text,
        category=question.category,
        user_answer=req.answer_text,
        code_submitted=req.code_submitted
    )

    db_answer = models.UserAnswer(
        question_id=question.id,
        answer_text=req.answer_text,
        code_submitted=req.code_submitted,
        grammar_score=evaluation.get("grammar_score", 0.0),
        technical_score=evaluation.get("technical_score", 0.0),
        communication_score=evaluation.get("communication_score", 0.0),
        fluency_score=evaluation.get("fluency_score", 0.0),
        confidence_score=evaluation.get("confidence_score", 0.0),
        problem_solving_score=evaluation.get("problem_solving_score", 0.0),
        feedback_text=evaluation.get("feedback_text", ""),
        star_feedback=evaluation.get("star_feedback"),
        suggestions=evaluation.get("suggestions", []),
        correct_answer=evaluation.get("correct_answer", "")
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)

    return db_answer

@router.post("/voice-transcribe")
async def voice_transcribe(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    try:
        audio_bytes = await file.read()
        transcription = openai_service.transcribe_audio_with_whisper(audio_bytes, file.filename)
        return {"text": transcription}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )

@router.post("/finish/{session_id}")
def finish_interview(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    if session.status == "completed":
        # Already compiled, return existing report
        report = db.query(models.FinalReport).filter(
            models.FinalReport.session_id == session.id
        ).first()
        if report:
            return report
            
    # Gather questions & answers
    qa_list = []
    questions = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.session_id == session_id
    ).order_by(models.InterviewQuestion.order_index).all()
    
    for q in questions:
        ans = db.query(models.UserAnswer).filter(models.UserAnswer.question_id == q.id).first()
        if ans:
            qa_list.append({
                "question_text": q.question_text,
                "category": q.category,
                "user_answer": ans.answer_text,
                "code_submitted": ans.code_submitted,
                "grammar_score": ans.grammar_score,
                "technical_score": ans.technical_score,
                "communication_score": ans.communication_score,
                "confidence_score": ans.confidence_score,
                "problem_solving_score": ans.problem_solving_score
            })
            
    if not qa_list:
        raise HTTPException(
            status_code=400,
            detail="Cannot complete interview. No questions have been answered yet."
        )

    # Generate final review aggregation
    report_data = openai_service.generate_final_report_with_ai(
        role=session.role,
        difficulty=session.difficulty,
        qa_list=qa_list
    )

    # Update session scores
    session.overall_score = report_data.get("overall_score", 0.0)
    session.technical_score = report_data.get("technical_score", 0.0)
    session.communication_score = report_data.get("communication_score", 0.0)
    session.confidence_score = report_data.get("confidence_score", 0.0)
    session.problem_solving_score = report_data.get("problem_solving_score", 0.0)
    session.summary = report_data.get("summary", "")
    session.roadmap = report_data.get("roadmap", [])
    session.recommended_topics = report_data.get("recommended_topics", [])
    session.status = "completed"

    # Gamification points
    xp_score = int(session.overall_score * 2.5) # Max 250 XP
    session.xp_gained = xp_score
    current_user.xp += xp_score
    
    # Check level up (Every 500 XP is a level)
    new_level = (current_user.xp // 500) + 1
    levelled_up = False
    if new_level > current_user.level:
        current_user.level = new_level
        levelled_up = True
        
        # Award level achievement badge
        badge = models.Badge(
            user_id=current_user.id,
            name=f"Level {new_level} Ascendant",
            description=f"Unlocked by scaling code heights to reach Level {new_level}.",
            icon="🌟"
        )
        db.add(badge)
        
    # Check active streak
    now = datetime.utcnow()
    streak_diff = now - current_user.last_active
    if streak_diff.days <= 1:
        # If user active yesterday, increment streak
        if streak_diff.days == 1 or (streak_diff.total_seconds() > 43200): # 12 hours buffer
            current_user.streak += 1
    else:
        current_user.streak = 1 # reset streak
        
    current_user.last_active = now
    
    # Award special milestone badges
    if current_user.streak == 3:
        # Check if they already have it
        badge_exists = db.query(models.Badge).filter_by(user_id=current_user.id, name="3-Day Burn").first()
        if not badge_exists:
            db.add(models.Badge(user_id=current_user.id, name="3-Day Burn", description="Practiced 3 days in a row.", icon="🔥"))
            
    if len(current_user.interviews) == 1:
        badge_exists = db.query(models.Badge).filter_by(user_id=current_user.id, name="First Contact").first()
        if not badge_exists:
            db.add(models.Badge(user_id=current_user.id, name="First Contact", description="Completed your first AI interview session.", icon="🚀"))

    db.commit()

    return {
        "session_id": session.id,
        "overall_score": session.overall_score,
        "technical_score": session.technical_score,
        "communication_score": session.communication_score,
        "confidence_score": session.confidence_score,
        "problem_solving_score": session.problem_solving_score,
        "summary": session.summary,
        "roadmap": session.roadmap,
        "recommended_topics": session.recommended_topics,
        "xp_gained": session.xp_gained,
        "levelled_up": levelled_up,
        "current_level": current_user.level
    }

@router.get("/session/{session_id}")
def get_session_details(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
        
    questions = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.session_id == session_id
    ).order_by(models.InterviewQuestion.order_index).all()
    
    response_q = []
    for q in questions:
        ans = db.query(models.UserAnswer).filter(models.UserAnswer.question_id == q.id).first()
        response_q.append({
            "id": q.id,
            "question_text": q.question_text,
            "category": q.category,
            "order_index": q.order_index,
            "code_template": q.code_template,
            "bookmarked": q.bookmarked,
            "answer": ans
        })
        
    return {
        "session": session,
        "questions": response_q
    }

@router.post("/session/bookmark/{question_id}")
def toggle_bookmark(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    question = db.query(models.InterviewQuestion).filter(
        models.InterviewQuestion.id == question_id
    ).first()
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    session = db.query(models.InterviewSession).filter(
        models.InterviewSession.id == question.session_id,
        models.InterviewSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    question.bookmarked = not question.bookmarked
    db.commit()
    
    return {"question_id": question.id, "bookmarked": question.bookmarked}

@router.get("/history")
def get_interview_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.InterviewSession).filter(
        models.InterviewSession.user_id == current_user.id
    ).order_by(models.InterviewSession.created_at.desc()).all()
    return sessions
