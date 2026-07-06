import numpy as np
from sqlalchemy.orm import Session
from app.database import models
from typing import List, Dict, Any
from app.services.openai_service import is_mock_mode, client

def get_embedding(text: str) -> List[float]:
    """
    Generates embedding vector. If OpenAI key is missing,
    creates a deterministic normalized vector based on text content.
    """
    if is_mock_mode():
        # Create a deterministic mock vector of 128 dimensions
        # This keeps math calculations working without calling any external servers.
        vector = np.zeros(128)
        text_clean = text.lower().strip()
        for i in range(128):
            if i < len(text_clean):
                vector[i] = ord(text_clean[i]) % 17
            else:
                vector[i] = (i * 7) % 13
        # Normalize the vector to unit length
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()
        
    try:
        response = client.embeddings.create(
            input=[text.replace("\n", " ")],
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding in OpenAI: {e}")
        # fallback
        return get_embedding(text)

def add_document(db: Session, filename: str, content: str):
    """
    Splits document into chunks, generates embeddings, and saves to database.
    """
    # Simple sliding window chunker: chunks of 800 chars overlapping by 200
    chunk_size = 800
    overlap = 200
    
    chunks = []
    start = 0
    while start < len(content):
        end = start + chunk_size
        chunks.append(content[start:end])
        if end >= len(content):
            break
        start += chunk_size - overlap
        
    for chunk in chunks:
        chunk = chunk.strip()
        if len(chunk) < 30:
            continue
        emb = get_embedding(chunk)
        db_chunk = models.DocumentChunk(
            filename=filename,
            content=chunk,
            embedding=emb
        )
        db.add(db_chunk)
    db.commit()

def search_documents(db: Session, query: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Fetches chunks, computes Cosine Similarity using NumPy, and returns the top matches.
    """
    query_emb = np.array(get_embedding(query))
    all_chunks = db.query(models.DocumentChunk).all()
    if not all_chunks:
        return []
        
    results = []
    for chunk in all_chunks:
        chunk_emb = np.array(chunk.embedding)
        
        # Cosine Similarity = dot(A, B) / (||A|| * ||B||)
        dot_val = np.dot(query_emb, chunk_emb)
        norm_q = np.linalg.norm(query_emb)
        norm_c = np.linalg.norm(chunk_emb)
        
        similarity = dot_val / (norm_q * norm_c) if (norm_q > 0 and norm_c > 0) else 0.0
        
        results.append({
            "filename": chunk.filename,
            "content": chunk.content,
            "similarity": float(similarity)
        })
        
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:limit]
