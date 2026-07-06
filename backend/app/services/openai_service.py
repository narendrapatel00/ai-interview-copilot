import json
import re
import os
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.core.config import settings

# Initialize client only if key is available
client = None
if settings.OPENAI_API_KEY:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

def is_mock_mode() -> bool:
    return client is None

# Helper to scan keywords in text for mock customization
def extract_keywords_from_text(text: str) -> List[str]:
    keywords = [
        "Python", "JavaScript", "TypeScript", "React", "Node.js", "Express", "Django", "FastAPI",
        "SQL", "PostgreSQL", "MongoDB", "MySQL", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "LLM", "RAG", "Git",
        "HTML", "CSS", "Tailwind CSS", "Java", "C++", "Go", "Rust", "CI/CD", "Redis", "Elasticsearch"
    ]
    found = []
    text_lower = text.lower()
    for kw in keywords:
        # Match word boundaries to avoid substrings like 'Go' in 'Google'
        pattern = r'\b' + re.escape(kw.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(kw)
    return found

def analyze_resume_with_ai(resume_text: str) -> Dict[str, Any]:
    if is_mock_mode():
        # Smart Mock Resume Analyzer
        found_skills = extract_keywords_from_text(resume_text)
        if not found_skills:
            found_skills = ["Software Development", "Git", "HTML/CSS"]
            
        all_possible_skills = {
            "web": ["React", "TypeScript", "Node.js", "FastAPI", "Tailwind CSS", "SQL", "Docker", "AWS"],
            "ai": ["Python", "PyTorch", "Machine Learning", "NLP", "LLMs", "RAG", "Docker", "Git"],
            "backend": ["Python", "Go", "Java", "FastAPI", "PostgreSQL", "Redis", "Docker", "Kubernetes", "CI/CD"]
        }
        
        # Determine likely focus based on keywords
        focus = "web"
        if any(x in ["Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "NLP", "LLM", "RAG"] for x in found_skills):
            focus = "ai"
        elif any(x in ["Java", "Go", "C++", "Redis", "Kubernetes"] for x in found_skills):
            focus = "backend"
            
        missing = [s for s in all_possible_skills[focus] if s not in found_skills][:3]
        if not missing:
            missing = ["System Design", "Microservices", "Cloud Deployment (AWS/GCP)"]
            
        strengths = [
            f"Strong base in core technology: {', '.join(found_skills[:3])}.",
            "Demonstrates clear experience in implementing code and version control.",
            "Good academic or project background with practical implementations."
        ]
        weaknesses = [
            f"Lacks deep exposure to critical modern stack tools like {', '.join(missing)}.",
            "Projects lack metric-driven impact descriptions (e.g., 'improved performance by X%').",
            "Resume structure could benefit from stronger achievement verbs."
        ]
        
        project_suggestions = [
            {
                "title": "Scalable Microservices Backend",
                "description": f"Build a multi-service web backend using {', '.join(missing[:2])} and FastAPI, containerized with Docker, integrating Redis for caching and rate limiting."
            },
            {
                "title": "RAG-based AI Agent / Document Search",
                "description": "Develop a Retrieval-Augmented Generation search service that processes PDF manuals, stores embeddings in a vector database, and answers queries via GPT-4o-mini."
            }
        ]
        
        ats_score = min(max(55 + len(found_skills) * 3, 60), 92)
        
        return {
            "ats_score": ats_score,
            "skills": found_skills,
            "missing_skills": missing,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "project_suggestions": project_suggestions,
            "resume_summary": "Motivated developer with practical hands-on experience in building systems using modern developer tools. Skilled in designing APIs, writing clean modular code, and collaborating on product lifecycle development.",
            "improvement_suggestions": [
                "Quantify achievements in project descriptions (e.g., speed up database queries by 30%).",
                f"Add missing technologies like {', '.join(missing)} to increase keyword matches for ATS tools.",
                "Structure the summary statement to highlight specific domains of expertise (e.g. Frontend vs AI Engineering)."
            ]
        }
    
    # Real OpenAI prompt for Resume Analysis
    prompt = f"""
    You are a professional ATS scanner and technical hiring manager. Analyze the following resume text.
    Resume:
    \"\"\"{resume_text}\"\"\"
    
    Respond STRICTLY in a JSON object with the following keys. Do not include any markdown fences or introductory text. Just valid JSON.
    {{
        "ats_score": <int between 0 and 100>,
        "skills": [<list of strings of skills present>],
        "missing_skills": [<list of 3-5 important industry skills missing based on their profile>],
        "strengths": [<list of 3 strings of key strengths>],
        "weaknesses": [<list of 3 strings of key areas for improvement>],
        "project_suggestions": [
            {{
                "title": "Project Title",
                "description": "Short project description to help them gain missing skills"
            }}
        ],
        "resume_summary": "A suggested professional resume summary rewrite",
        "improvement_suggestions": [<list of 3 actionable ATS formatting or structure improvement recommendations>]
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a professional ATS optimizer that returns JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        print(f"Error in analyze_resume_with_ai: {e}")
        # fallback to mock
        return analyze_resume_with_ai(resume_text)

def optimize_resume_with_ai(resume_text: str) -> Dict[str, Any]:
    if is_mock_mode():
        found_skills = extract_keywords_from_text(resume_text)
        skills_str = ", ".join(found_skills[:4]) if found_skills else "Software Engineering"
        return {
            "optimized_summary": f"Accomplished Technical Specialist with expertise in {skills_str}. Proven track record of architecting scalable applications, optimizing database performance, and driving developer workflows. Adept at leveraging modern practices like CI/CD, unit testing, and agile collaboration to deliver features on schedule with high reliability.",
            "optimized_projects": [
                {
                    "original_title": "Web App Development",
                    "optimized_title": "High-Performance Full-Stack Web Application",
                    "bullets": [
                        "Architected backend services using modern API design patterns, boosting load capacity by 35%.",
                        "Implemented robust client-side routing, state management, and localized storage, reducing UI latency by 200ms.",
                        "Configured end-to-end testing pipelines and CI workflows, reducing release bug occurrences by 18%."
                    ]
                },
                {
                    "original_title": "Machine Learning Script",
                    "optimized_title": "Scalable Retrieval-Augmented Machine Learning Pipeline",
                    "bullets": [
                        "Designed and deployed a similarity search backend using vector embeddings, enhancing query relevance by 40%.",
                        "Created automated tokenization and chunking pipelines processing multi-gigabyte document databases.",
                        "Optimized inference batch sizes on target environments, reducing compute overhead by 22%."
                    ]
                }
            ]
        }
        
    prompt = f"""
    You are an expert resume writer. Optimize the following resume text by rewriting the summary and major projects into high-impact, action-oriented, and metric-driven statements (STAR format).
    Resume:
    \"\"\"{resume_text}\"\"\"
    
    Respond STRICTLY in a JSON object with the following keys. Do not include markdown wraps.
    {{
        "optimized_summary": "A premium summary statement",
        "optimized_projects": [
            {{
                "original_title": "Name of project found in resume",
                "optimized_title": "Upgraded, professional project title",
                "bullets": [
                    "Action-oriented STAR bullet point 1 starting with strong verb and including metrics",
                    "Action-oriented STAR bullet point 2",
                    "Action-oriented STAR bullet point 3"
                ]
            }}
        ]
    }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a professional resume optimizer that returns JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error in optimize_resume_with_ai: {e}")
        # fallback
        return optimize_resume_with_ai(resume_text)

def generate_interview_questions(resume_text: Optional[str], role: str, difficulty: str, num_questions: int = 5) -> List[Dict[str, Any]]:
    if is_mock_mode():
        # Generate realistic questions depending on the chosen role
        questions = []
        role_lower = role.lower()
        
        # Core templates for coding, behavioral, technical, and system design
        if "ai" in role_lower or "ml" in role_lower or "machine learning" in role_lower:
            pool = [
                {
                    "question_text": "What is the difference between L1 and L2 regularization? How do they affect the coefficients of a model physically?",
                    "category": "technical",
                    "ideal_answer": "L1 (Lasso) regularization adds a penalty equal to the absolute value of coefficients, leading to sparse models where some coefficients become exactly zero. L2 (Ridge) adds a penalty equal to the square of coefficients, shrinking them towards zero but never making them exactly zero. This helps handle multicollinearity."
                },
                {
                    "question_text": "Given a sorted array of integers, write a function to search for a target element. If found, return its index; otherwise, return -1. Optimize for time complexity.",
                    "category": "coding",
                    "code_template": "def binary_search(arr: list[int], target: int) -> int:\n    # Write your code here\n    pass",
                    "ideal_answer": "Use Binary Search with a left and right pointer, finding the mid-point and updating pointers accordingly. Time complexity: O(log N)."
                },
                {
                    "question_text": "Describe a time when you had to work with a messy dataset. What steps did you take to clean it, and how did you choose what data to impute or drop?",
                    "category": "behavioral",
                    "ideal_answer": "Describe using STAR method. Mention checking for null values, analyzing distributions, handling outliers with IQR, using mean/median/mode/KNN imputation based on context, and verifying that cleaning did not bias predictions."
                },
                {
                    "question_text": "How would you design a system to serve real-time recommendations to 10 million daily active users with sub-100ms latency?",
                    "category": "system_design",
                    "ideal_answer": "Use a two-stage recommender: Candidate Generation (filtering down from millions to hundreds using light models or embeddings) followed by Ranking (using heavy deep models). Implement Redis caching for user profiles and candidates, and host inference containers behind a load balancer."
                },
                {
                    "question_text": "How does Retrieval-Augmented Generation (RAG) work, and what are the main techniques you would use to resolve Hallucination issues?",
                    "category": "ml",
                    "ideal_answer": "RAG works by chunking documents, embedding them into a vector space, querying similar chunks using a user prompt, and passing retrieved context into the LLM prompt. Hallucinations are reduced by chunk metadata enrichment, query expansion, re-ranking, and setting prompt constraints."
                }
            ]
        elif "front" in role_lower:
            pool = [
                {
                    "question_text": "Explain how React's Virtual DOM works, and what the key differences are between Virtual DOM diffing in React 18 vs previous versions.",
                    "category": "technical",
                    "ideal_answer": "React creates an in-memory lightweight representation of the UI called Virtual DOM. When state changes, it generates a new Virtual DOM tree and diffs it with the previous one (reconciliation). React 18 introduced Concurrent features where rendering can be paused and prioritizes updates using fiber scheduler."
                },
                {
                    "question_text": "Write a function that flattens a deeply nested JavaScript array. For example: [1, [2, [3, [4]], 5]] should become [1, 2, 3, 4, 5].",
                    "category": "coding",
                    "code_template": "function flattenArray(arr) {\n    // Write your code here\n    return [];\n}",
                    "ideal_answer": "Can be solved recursively by iterating through items and calling flatten recursively, or iteratively using a stack/queue. ES6 flat(Infinity) is the built-in way, but custom implementation demonstrates algorithm skills."
                },
                {
                    "question_text": "Describe a project where you had to optimize client-side performance. What tools did you use to measure metrics, and what changes did you deploy?",
                    "category": "behavioral",
                    "ideal_answer": "Mention lighthouse scores, Chrome DevTools. Techniques include code-splitting using React.lazy/dynamic imports, image compression, memoization (useMemo/useCallback), caching static files, and reducing bundle sizes."
                },
                {
                    "question_text": "Design a frontend architecture for a real-time collaborative doc editing tool (like Google Docs). How do you handle document state synchronization?",
                    "category": "system_design",
                    "ideal_answer": "Use WebSockets for real-time bi-directional transport. State synchronization can be managed using Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs, like Yjs) to handle concurrent edits on the client-side."
                },
                {
                    "question_text": "What is CSS Specificity, and how does the browser calculate priority between class selectors, inline styles, IDs, and Tailwind utility classes?",
                    "category": "technical",
                    "ideal_answer": "Specificity is a weight applied to a CSS declaration. Calculated as: Inline styles (1000) > IDs (100) > Classes, attributes, pseudo-classes (10) > Elements, pseudo-elements (1). Tailwind utility classes are plain classes (10 specificity), and rely on order of definition in the final stylesheet."
                }
            ]
        else:
            # Default to Software Engineer / Backend Developer template
            pool = [
                {
                    "question_text": "Describe the differences between SQL relational databases and NoSQL databases. In what situations is NoSQL the superior choice?",
                    "category": "technical",
                    "ideal_answer": "SQL databases are table-based, structured, support ACID properties, and scale vertically. NoSQL databases are document, key-value, graph, or column-based, schema-less, eventually consistent, and scale horizontally. NoSQL is better for rapid scaling, unstructured data, or high-throughput caching."
                },
                {
                    "question_text": "Write a function in your preferred language to check if a string contains balanced parentheses: e.g. '()[]{}' is balanced, '(]' is not.",
                    "category": "coding",
                    "code_template": "def is_balanced(s: str) -> bool:\n    # Write your code here\n    pass",
                    "ideal_answer": "Use a stack. Push opening brackets. When a closing bracket is found, pop from the stack and verify matching. Return True if stack is empty at the end."
                },
                {
                    "question_text": "Describe a situation where you had a disagreement with a team member on a technical design decision. How did you resolve it?",
                    "category": "behavioral",
                    "ideal_answer": "Focus on active listening, listing pros/cons of both designs, gathering data/benchmarks, collaborating on a compromise or referring to team objectives, and executing the final choice with full commitment."
                },
                {
                    "question_text": "How would you design a distributed rate limiter for a public-facing REST API? Detail the algorithm and storage mechanism.",
                    "category": "system_design",
                    "ideal_answer": "Use Redis for low-latency central storage. Algorithms include Token Bucket or Sliding Window Log/Counter. With Redis, implement Sliding Window Counter using sorted sets (ZREMRANGEBYSCORE) for high accuracy and scalability across application instances."
                },
                {
                    "question_text": "What is the difference between a process and a thread? Explain how multiprocessing and multithreading work under the GIL in Python.",
                    "category": "technical",
                    "ideal_answer": "A process is an independent execution unit with its own memory space. A thread is a lightweight sub-unit that shares memory with other threads in the same process. Python's GIL (Global Interpreter Lock) restricts executing multiple threads of Python bytecode at once, meaning multithreading is useful for I/O bounds, but multiprocessing is required for CPU-bound parallelism."
                }
            ]
            
        for i in range(min(num_questions, len(pool))):
            question = pool[i].copy()
            question["order_index"] = i + 1
            questions.append(question)
            
        return questions
        
    # Real OpenAI questions generation
    resume_context = f"Resume details: {resume_text}" if resume_text else "No resume uploaded."
    prompt = f"""
    You are a principal technical interviewer. Generate {num_questions} interview questions tailored to the candidate's profile.
    Role: {role}
    Difficulty: {difficulty}
    {resume_context}
    
    The questions must cover a mix of categories: technical concepts, behavioral, coding, system design, and database queries.
    For the coding question, provide a starter code template.
    
    Respond STRICTLY in a JSON object with the following format. Do not include markdown wrapper.
    {{
        "questions": [
            {{
                "question_text": "The question description",
                "category": "one of: technical, behavioral, coding, system_design, sql, ml",
                "code_template": "Starter code block string (only for coding questions, else null)",
                "ideal_answer": "A concise model answer explaining what a strong response should contain"
            }}
        ]
    }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a professional technical recruiter generating interview questions in JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4
        )
        data = json.loads(response.choices[0].message.content)
        questions = []
        for i, q in enumerate(data.get("questions", [])):
            q["order_index"] = i + 1
            questions.append(q)
        return questions
    except Exception as e:
        print(f"Error in generate_interview_questions: {e}")
        return generate_interview_questions(resume_text, role, difficulty, num_questions)

def evaluate_answer_with_ai(question_text: str, category: str, user_answer: str, code_submitted: Optional[str] = None) -> Dict[str, Any]:
    if is_mock_mode():
        # Heuristics-based scoring for realistic mock testing
        words_count = len(user_answer.split())
        code_words_count = len(code_submitted.split()) if code_submitted else 0
        
        # Simple grading based on length and core terms
        tech_terms = ["system", "data", "algorithm", "time complexity", "react", "hooks", "index", "cache", "latency", "scale", "git", "process", "thread"]
        found_terms = [t for t in tech_terms if t in user_answer.lower() or (code_submitted and t in code_submitted.lower())]
        
        # Base scores
        comm_score = min(max(50.0 + words_count * 0.4, 60.0), 95.0)
        tech_score = min(max(45.0 + len(found_terms) * 8.0, 50.0), 96.0)
        grammar_score = 90.0 if words_count > 10 else 70.0
        fluency_score = min(comm_score + 2.0, 98.0)
        confidence_score = 85.0 if words_count > 15 else 60.0
        prob_solving_score = 80.0 if (category == "coding" and code_words_count > 20) else 75.0
        
        # Adjust score if user didn't write much
        if words_count < 6 and code_words_count < 10:
            comm_score = 40.0
            tech_score = 30.0
            confidence_score = 35.0
            prob_solving_score = 30.0
            feedback_text = "The answer was very brief. To demonstrate your capability, try to elaborate using concrete examples, explaining your core logic, or listing trade-offs."
            suggestions = ["Provide a detailed explanation.", "Use the STAR method for behavioral answers.", "Discuss time/space complexity for coding tasks."]
        else:
            feedback_text = f"Solid response. You addressed the query directly and showcased practical understanding of key concepts. Your structure is logical, and vocabulary fits standard industry jargon."
            suggestions = [
                "Quantify technical metrics to ground your assertions.",
                "Structure answers with bullet points: Problem statement -> Design -> Execution -> Results.",
                "Mention potential edge cases or alternative paradigms to show depth."
            ]
            
        ideal_answer = "A strong answer should introduce the concept, mention how it applies in production systems, compare it with alternatives, and outline any scaling limits."
        
        star_feedback = None
        if category == "behavioral":
            star_feedback = {
                "situation": "Identified" if words_count > 15 else "Lacking context",
                "task": "Explained" if words_count > 25 else "Briefly touched on",
                "action": "Well detailed" if words_count > 35 else "Should list specific actions taken",
                "result": "Stated" if words_count > 45 else "Missing key metrics or outcomes"
            }
            
        return {
            "grammar_score": grammar_score,
            "technical_score": tech_score,
            "communication_score": comm_score,
            "fluency_score": fluency_score,
            "confidence_score": confidence_score,
            "problem_solving_score": prob_solving_score,
            "feedback_text": feedback_text,
            "star_feedback": star_feedback,
            "suggestions": suggestions,
            "correct_answer": ideal_answer
        }
        
    # Real OpenAI assessment
    prompt = f"""
    You are an expert interviewer. Grade this candidate's answer.
    Question: {question_text}
    Category: {category}
    User Answer: {user_answer}
    Code Submitted: {code_submitted if code_submitted else "N/A"}
    
    Evaluate the response and output a JSON object containing the scores and detailed feedback.
    If the category is behavioral, analyze if they followed the STAR method (Situation, Task, Action, Result) in the "star_feedback" field.
    
    Respond STRICTLY in a JSON object with this format. Do not use markdown wraps.
    {{
        "grammar_score": <float between 0 and 100>,
        "technical_score": <float between 0 and 100>,
        "communication_score": <float between 0 and 100>,
        "fluency_score": <float between 0 and 100>,
        "confidence_score": <float between 0 and 100>,
        "problem_solving_score": <float between 0 and 100>,
        "feedback_text": "Detailed written feedback summarizing strengths and gaps",
        "star_feedback": {{
            "situation": "Evaluation of Situation aspect",
            "task": "Evaluation of Task aspect",
            "action": "Evaluation of Action aspect",
            "result": "Evaluation of Result aspect"
        }} // set to null if not behavioral
        "suggestions": ["Actionable improvement tip 1", "Actionable improvement tip 2"],
        "correct_answer": "The ideal comprehensive answer that should have been given"
    }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a professional technical evaluator returning JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error in evaluate_answer_with_ai: {e}")
        return evaluate_answer_with_ai(question_text, category, user_answer, code_submitted)

def generate_final_report_with_ai(role: str, difficulty: str, qa_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    if is_mock_mode():
        # Calculate averages from answers
        tech_scores = [q.get("technical_score", 70.0) for q in qa_list]
        comm_scores = [q.get("communication_score", 70.0) for q in qa_list]
        conf_scores = [q.get("confidence_score", 70.0) for q in qa_list]
        ps_scores = [q.get("problem_solving_score", 70.0) for q in qa_list]
        
        avg_tech = sum(tech_scores) / len(tech_scores) if tech_scores else 75.0
        avg_comm = sum(comm_scores) / len(comm_scores) if comm_scores else 78.0
        avg_conf = sum(conf_scores) / len(conf_scores) if conf_scores else 80.0
        avg_ps = sum(ps_scores) / len(ps_scores) if ps_scores else 75.0
        overall = (avg_tech + avg_comm + avg_conf + avg_ps) / 4.0
        
        roadmap = [
            {
                "topic": "System Architecture & Scalability",
                "status": "Priority",
                "steps": [
                    "Study Cache eviction patterns and distributed lock strategies in Redis.",
                    "Implement a local microservice router with rate limiting to test throughput constraints."
                ],
                "resources": ["System Design Primer (GitHub)", "Designing Data-Intensive Applications (Book)"]
            },
            {
                "topic": "Algorithms & Problem Solving",
                "status": "Ongoing",
                "steps": [
                    "Practice Tree traversals (DFS/BFS) and Heap-based priority queue questions.",
                    "Review sliding window patterns and memoized dynamic programming solutions."
                ],
                "resources": ["LeetCode Top Interview 150", "NeetCode.io Roadmap"]
            }
        ]
        
        recommended_topics = ["Message Queues (RabbitMQ/Kafka)", "PostgreSQL Indexing & Optimization", "GraphQL vs gRPC design patterns"]
        
        summary = f"The candidate demonstrated strong capability in the {role} interview ({difficulty} level). Communication was smooth, showing professional delivery. Gaps were noted in edge-case optimization for code submissions and details on high-scale cache invalidation."
        
        return {
            "overall_score": round(overall, 1),
            "technical_score": round(avg_tech, 1),
            "communication_score": round(avg_comm, 1),
            "confidence_score": round(avg_conf, 1),
            "problem_solving_score": round(avg_ps, 1),
            "summary": summary,
            "roadmap": roadmap,
            "recommended_topics": recommended_topics
        }
        
    prompt = f"""
    You are a staff technical hiring panel. Compile a comprehensive evaluation report for a candidate who completed an interview.
    Role: {role}
    Difficulty: {difficulty}
    
    Session QA Data:
    {json.dumps(qa_list, default=str)}
    
    Aggregate their scores and compile an actionable feedback review.
    Provide a personalized career roadmap to help them study weak areas.
    
    Respond STRICTLY in a JSON object with this format. Do not use markdown wraps.
    {{
        "overall_score": <float between 0 and 100>,
        "technical_score": <float between 0 and 100>,
        "communication_score": <float between 0 and 100>,
        "confidence_score": <float between 0 and 100>,
        "problem_solving_score": <float between 0 and 100>,
        "summary": "AI summary overview of the candidate performance",
        "roadmap": [
            {{
                "topic": "Topic area (e.g. Graph Algorithms)",
                "status": "Level of urgency (e.g. Immediate / Next Steps)",
                "steps": ["Step 1 to master this topic", "Step 2"],
                "resources": ["Link or book resource 1", "resource 2"]
            }}
        ],
        "recommended_topics": ["Specific technology 1", "Specific concept 2"]
    }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a senior technical hiring panel compiling final report in JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error in generate_final_report_with_ai: {e}")
        return generate_final_report_with_ai(role, difficulty, qa_list)

def transcribe_audio_with_whisper(audio_bytes: bytes, filename: str) -> str:
    if is_mock_mode():
        return "This is a transcribed sample response from the mock AI audio transcriber. In production, your microphone voice recording is sent to OpenAI Whisper API to output highly accurate transcriptions."
        
    try:
        # Write temporarily to transcribe
        temp_path = f"temp_{filename}"
        with open(temp_path, "wb") as f:
            f.write(audio_bytes)
            
        with open(temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file
            )
            
        os.remove(temp_path)
        return transcript.text
    except Exception as e:
        print(f"Error in transcribe_audio_with_whisper: {e}")
        return "Speech-to-text failed. Fallback default text answer recorded."
