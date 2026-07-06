from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" or "admin"
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    interviews = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    parsed_text = Column(Text, nullable=False)
    ats_score = Column(Integer, default=0)
    
    # Analysis stored as JSON
    skills = Column(JSON, nullable=True) # list of skills
    missing_skills = Column(JSON, nullable=True) # list of missing skills
    strengths = Column(JSON, nullable=True) # list of strengths
    weaknesses = Column(JSON, nullable=True) # list of weaknesses
    project_suggestions = Column(JSON, nullable=True) # list of projects
    resume_summary = Column(Text, nullable=True)
    improvement_suggestions = Column(JSON, nullable=True)
    
    # Optimizer outputs
    optimized_summary = Column(Text, nullable=True)
    optimized_projects = Column(JSON, nullable=True) # list of optimized projects

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="resumes")
    interviews = relationship("InterviewSession", back_populates="resume")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    role = Column(String, nullable=False) # e.g. "Software Engineer"
    difficulty = Column(String, nullable=False) # "Easy", "Medium", "Hard"
    time_limit = Column(Integer, default=30) # in minutes
    status = Column(String, default="ongoing") # "ongoing" or "completed"
    
    # Final feedback scores
    overall_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    problem_solving_score = Column(Float, nullable=True)
    summary = Column(Text, nullable=True)
    roadmap = Column(JSON, nullable=True) # AI roadmap steps
    recommended_topics = Column(JSON, nullable=True) # topics to practice
    xp_gained = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="interviews")
    resume = relationship("Resume", back_populates="interviews")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    category = Column(String, nullable=False) # "behavioral", "technical", "coding", "system_design", "sql", etc.
    order_index = Column(Integer, nullable=False)
    code_template = Column(Text, nullable=True) # for coding questions
    ideal_answer = Column(Text, nullable=True)
    bookmarked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("UserAnswer", uselist=False, back_populates="question", cascade="all, delete-orphan")

class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    code_submitted = Column(Text, nullable=True)
    audio_url = Column(String, nullable=True)
    
    # Detailed AI feedback per answer
    grammar_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    fluency_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    feedback_text = Column(Text, nullable=True)
    star_feedback = Column(JSON, nullable=True) # STAR specific analysis
    suggestions = Column(JSON, nullable=True)
    correct_answer = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("InterviewQuestion", back_populates="answer")

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=False) # list of floats
    created_at = Column(DateTime, default=datetime.utcnow)
