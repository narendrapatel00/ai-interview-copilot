from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.routers.auth import get_current_user
from app.services import pdf_service, rag_service
from app.database import models
from pydantic import BaseModel

router = APIRouter(prefix="/rag", tags=["RAG (Retrieval Augmented Generation)"])

class QuerySearchRequest(BaseModel):
    query: str
    limit: int = 3

@router.post("/upload")
async def upload_guide_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf") and not file.filename.endswith(".txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF or TXT documents are supported for RAG upload."
        )
        
    try:
        content_bytes = await file.read()
        if file.filename.endswith(".pdf"):
            extracted_text = pdf_service.extract_text_from_pdf(content_bytes)
        else:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
        
    if not extracted_text or len(extracted_text.strip()) < 30:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File content is too small or blank."
        )
        
    # Index document in vector similarity DB
    try:
        rag_service.add_document(db, file.filename, extracted_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index document: {str(e)}"
        )
        
    return {"message": f"Successfully indexed and vectorized document: {file.filename}"}

@router.post("/search")
def search_guide_documents(
    req: QuerySearchRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        results = rag_service.search_documents(db, req.query, req.limit)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search query failed: {str(e)}"
        )
