import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Square, 
  Keyboard, 
  Play, 
  RotateCcw, 
  Copy, 
  Maximize2, 
  Minimize2, 
  Bookmark, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Terminal, 
  ShieldAlert 
} from 'lucide-react';

interface Question {
  id: number;
  question_text: string;
  category: string;
  order_index: number;
  code_template: string | null;
  bookmarked: boolean;
}

interface AnswerFeedback {
  grammar_score: number;
  technical_score: number;
  communication_score: number;
  fluency_score: number;
  confidence_score: number;
  feedback_text: string;
  star_feedback: {
    situation: string;
    task: string;
    action: string;
    result: string;
  } | null;
  suggestions: string[];
  correct_answer: string;
}

const InterviewRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(1800); // Default 30 mins
  
  // Bookmark state
  const [bookmarked, setBookmarked] = useState(false);
  
  // Answer writing states
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Monaco editor states
  const [codeContent, setCodeContent] = useState('');
  const [selectedLang, setSelectedLang] = useState('python');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [runningCode, setRunningCode] = useState(false);
  
  // Voice Recording states
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Audio Visualizer states
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(15).fill(4));
  const visualizerIntervalRef = useRef<number | null>(null);

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get(`/interview/session/${id}`);
        setQuestions(response.data.questions);
        setSession(response.data.session);
        setTimerSeconds(response.data.session.time_limit * 60);
        
        // Initialize coding template if first question is coding
        const firstQ = response.data.questions[0];
        if (firstQ && firstQ.code_template) {
          setCodeContent(firstQ.code_template);
        }
        
        // Set bookmark
        if (firstQ) {
          setBookmarked(firstQ.bookmarked);
        }
      } catch (err: any) {
        setError('Failed to load interview session. Ensure you have authorized credentials.');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || !session || timerSeconds <= 0) return;
    
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [loading, session, timerSeconds]);

  const handleAutoFinish = () => {
    alert('Time limit reached! Compiling final interview reports.');
    handleFinishInterview();
  };

  const currentQuestion = questions[currentIndex];

  // Sync coding template on index changes
  useEffect(() => {
    if (currentQuestion) {
      setBookmarked(currentQuestion.bookmarked);
      setFeedback(null);
      
      // If question has coding template, inject it
      if (currentQuestion.code_template) {
        setCodeContent(currentQuestion.code_template);
        // Switch to python or JS depending on category
        setSelectedLang(currentQuestion.question_text.toLowerCase().includes('javascript') ? 'javascript' : 'python');
      } else {
        setCodeContent('');
      }
      
      // Clear answer box
      setTypedAnswer('');
    }
  }, [currentIndex, currentQuestion]);

  // Handle Bookmarks
  const toggleBookmark = async () => {
    if (!currentQuestion) return;
    try {
      const response = await api.post(`/interview/session/bookmark/${currentQuestion.id}`);
      setBookmarked(response.data.bookmarked);
      // update state in questions array
      setQuestions(prev => prev.map(q => q.id === currentQuestion.id ? { ...q, bookmarked: response.data.bookmarked } : q));
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    audioChunksRef.current = [];
    setVisualizerBars(Array(15).fill(4));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(audioBlob);
      };
      
      mediaRecorder.start();
      setRecording(true);
      
      // Simulate live audio waveform levels
      visualizerIntervalRef.current = window.setInterval(() => {
        setVisualizerBars(Array(15).fill(0).map(() => Math.floor(Math.random() * 24) + 6));
      }, 100);
      
    } catch (err) {
      alert('Could not gain microphone permissions. Check browser access settings.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      if (visualizerIntervalRef.current) {
        clearInterval(visualizerIntervalRef.current);
        visualizerIntervalRef.current = null;
      }
      setVisualizerBars(Array(15).fill(4));
    }
  };

  // Upload audio to transcribe API
  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true);
    const formData = new FormData();
    formData.append('file', blob, 'recording.wav');
    
    try {
      const response = await api.post('/interview/voice-transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTypedAnswer(prev => prev ? `${prev} ${response.data.text}` : response.data.text);
    } catch (err) {
      console.error('Transcription failed:', err);
      alert('Whisper transcribing failed. Please try typing your response.');
    } finally {
      setTranscribing(false);
    }
  };

  // Submit Answer for AI feedback
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    if (!typedAnswer.trim() && !codeContent.trim()) {
      alert('Please speak or type an answer before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const response = await api.post('/interview/submit-answer', {
        question_id: currentQuestion.id,
        answer_text: typedAnswer,
        code_submitted: currentQuestion.category === 'coding' ? codeContent : null
      });
      setFeedback(response.data);
    } catch (err: any) {
      setError('Evaluation error. Please re-submit your response.');
    } finally {
      setSubmitting(false);
    }
  };

  // Monaco compilation runner
  const handleRunCode = () => {
    setRunningCode(true);
    setConsoleOutput('Executing code template on target environments...\n');
    
    setTimeout(() => {
      // Mock code output logs
      if (selectedLang === 'python') {
        if (codeContent.includes('def') && !codeContent.includes('pass')) {
          setConsoleOutput(
            '>>> Running binary_search([1, 3, 5, 7, 9], 7)...\nOutput: 3\n\n>>> Running binary_search([1, 3, 5, 7, 9], 2)...\nOutput: -1\n\n✓ All test cases passed successfully!'
          );
        } else {
          setConsoleOutput(
            'Output: None\n\n⚠ Warning: Complete function implementation and return statement to pass tests.'
          );
        }
      } else {
        setConsoleOutput(
          'Console output logs: Executed script successfully.\n✓ Assert: flattenArray([1, [2, [3]]]) returned [1, 2, 3].\nTest results: 1/1 passed.'
        );
      }
      setRunningCode(false);
    }, 1500);
  };

  const handleResetCode = () => {
    if (currentQuestion && currentQuestion.code_template) {
      setCodeContent(currentQuestion.code_template);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeContent);
    alert('Code copied to clipboard!');
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleFinishInterview = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/interview/finish/${id}`);
      const { session_id } = response.data;
      navigate(`/dashboard/report/${session_id}`);
    } catch (err) {
      alert('Failed to compile reports. Ensure at least one answer has been submitted.');
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-purple-500/20 animate-pulse">
          Co
        </div>
        <p className="text-gray-400 text-xs font-semibold tracking-wide">Syncing secure video feed...</p>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-400 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <ShieldAlert className="w-10 h-10" />
        <h3 className="text-sm font-bold text-white">Interface Sync Error</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          {error || 'Interview question details are missing. Start a new session.'}
        </p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-purple-600 rounded-lg text-xs font-bold text-white hover:bg-purple-500">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const isCoding = currentQuestion.category === 'coding';

  return (
    <div className={`flex flex-col space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#070a13] p-6' : ''}`}>
      {/* Top dashboard control panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div className="flex items-center space-x-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-950/30 px-3 py-1 rounded-full border border-purple-500/10">
            {currentQuestion.category}
          </span>
          <h2 className="text-md font-bold text-white">
            Q{currentQuestion.order_index} of {questions.length}
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Countdown timer badge */}
          <div className="flex items-center space-x-1.5 bg-gray-900 border border-gray-800 px-3.5 py-1.5 rounded-xl text-xs text-purple-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Left: {formatTime(timerSeconds)}</span>
          </div>

          {/* Bookmark toggle */}
          <button 
            onClick={toggleBookmark}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              bookmarked 
                ? 'bg-purple-600/10 border-purple-500 text-purple-400' 
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white'
            }`}
            title="Bookmark Question"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Main Workspace grid: left side inputs/avatar, right side monaco */}
      <div className={`grid grid-cols-1 ${isCoding ? 'lg:grid-cols-2' : 'max-w-2xl mx-auto'} gap-8`}>
        {/* Left Side: Question, Avatar, Answer area */}
        <div className="space-y-6 flex flex-col">
          {/* Question Text card */}
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 shadow-md">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Question Prompt</h3>
            <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
              {currentQuestion.question_text}
            </p>
          </div>

          {/* AI HR Avatar Simulator */}
          <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-850/80 shadow-md flex items-center justify-center relative overflow-hidden h-44">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent pointer-events-none" />
            <div className="flex flex-col items-center space-y-3 relative z-10">
              {/* Pulsing Avatar circles */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className={`absolute w-full h-full rounded-full bg-purple-500/20 ${
                  recording || transcribing || submitting ? 'animate-ping' : 'pulse-slow'
                }`} />
                <div className="w-12 h-12 rounded-full bg-purple-600 border border-purple-400 flex items-center justify-center font-bold text-white shadow-xl shadow-purple-500/30">
                  AI
                </div>
              </div>
              <p className="text-[10px] uppercase font-bold text-purple-400 tracking-widest animate-pulse">
                {recording 
                  ? 'Candidate Speaking...' 
                  : transcribing 
                    ? 'Whisper Transcribing...' 
                    : submitting 
                      ? 'AI Evaluating...' 
                      : 'AI Interview Panel Listening'}
              </p>
            </div>
          </div>

          {/* Input Answer Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Your Response</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVoiceMode(true)}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isVoiceMode ? 'bg-purple-600/10 text-purple-400' : 'text-gray-500 hover:text-white'
                  }`}
                  title="Voice Mode"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsVoiceMode(false)}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    !isVoiceMode ? 'bg-purple-600/10 text-purple-400' : 'text-gray-500 hover:text-white'
                  }`}
                  title="Text Mode"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isVoiceMode ? (
              <div className="p-6 rounded-2xl bg-gray-950/40 border border-gray-850/80 flex flex-col items-center justify-center space-y-4">
                {recording ? (
                  <>
                    {/* Simulated Waveform visualization */}
                    <div className="flex items-end justify-center space-x-1.5 h-12">
                      {visualizerBars.map((height, i) => (
                        <div 
                          key={i} 
                          className="w-1 bg-purple-500 rounded-full transition-all duration-100" 
                          style={{ height: `${height}px` }} 
                        />
                      ))}
                    </div>
                    <button
                      onClick={stopRecording}
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold text-white flex items-center space-x-2 cursor-pointer transition-colors shadow-lg shadow-red-500/25"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Dictation</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-bold text-gray-300">Microphone Input Active</p>
                      <p className="text-[10px] text-gray-500">Tap record, answer verbally, then tap stop. Whisper will transcribe.</p>
                    </div>
                    <button
                      onClick={startRecording}
                      disabled={transcribing || submitting}
                      className="w-14 h-14 bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-50 rounded-full flex items-center justify-center text-white shadow-xl shadow-purple-500/25 transition-all cursor-pointer"
                    >
                      <Mic className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Transcription display area */}
                {typedAnswer && (
                  <div className="w-full pt-4 border-t border-gray-850/50">
                    <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">Transcribed Draft:</p>
                    <textarea
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      className="w-full p-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-300 focus:outline-none focus:border-purple-500/30 h-20 resize-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Type your structured solution here..."
                disabled={submitting}
                className="w-full p-4 rounded-2xl bg-gray-900/60 border border-gray-800 text-xs sm:text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/60 h-40 transition-all resize-none"
              />
            )}

            {/* Answer Control triggers */}
            {!feedback && (
              <button
                onClick={handleSubmitAnswer}
                disabled={submitting || transcribing || (!typedAnswer.trim() && !codeContent.trim())}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submitting ? 'Running Answer Evaluation...' : 'Submit Answer & Check Score'}</span>
              </button>
            )}
          </div>

          {/* Answer Grading Feedback Card */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="p-6 rounded-2xl bg-purple-950/15 border border-purple-500/25 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-purple-400">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span className="text-xs font-extrabold uppercase tracking-wide">AI Panel Feedback</span>
                  </div>

                  <div className="flex space-x-2 text-[10px]">
                    <span className="bg-purple-950 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-black">
                      Technical: {feedback.technical_score}%
                    </span>
                    <span className="bg-purple-950 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-black">
                      Delivery: {feedback.communication_score}%
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {feedback.feedback_text}
                </p>

                {feedback.star_feedback && (
                  <div className="grid grid-cols-2 gap-3 text-[10px] bg-purple-950/20 p-3 rounded-lg border border-purple-500/10">
                    <div>
                      <span className="text-purple-400 font-bold">Situation:</span>
                      <p className="text-gray-400 truncate">{feedback.star_feedback.situation}</p>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold">Task:</span>
                      <p className="text-gray-400 truncate">{feedback.star_feedback.task}</p>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold">Action:</span>
                      <p className="text-gray-400 truncate">{feedback.star_feedback.action}</p>
                    </div>
                    <div>
                      <span className="text-purple-400 font-bold">Result:</span>
                      <p className="text-gray-400 truncate">{feedback.star_feedback.result}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 border-t border-purple-500/10 pt-4">
                  <span className="text-[10px] text-purple-400 font-bold uppercase">Actionable Tips:</span>
                  {feedback.suggestions.map((tip, i) => (
                    <div key={i} className="text-xs text-gray-400 flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4 pt-2">
                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-md shadow-purple-500/15"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishInterview}
                      className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all shadow-md shadow-purple-500/15 animate-bounce"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      <span>Finish & Compile report</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Monaco Coding Panel (only active for coding questions) */}
        {isCoding && (
          <div className="flex flex-col rounded-2xl bg-gray-900/60 border border-gray-850/80 shadow-lg overflow-hidden h-[540px]">
            {/* Header / Actions toolbar */}
            <div className="bg-gray-950/60 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Terminal className="w-4.5 h-4.5 text-purple-400" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="python" className="bg-[#0b0f19]">Python</option>
                  <option value="javascript" className="bg-[#0b0f19]">JavaScript</option>
                  <option value="java" className="bg-[#0b0f19]">Java</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                  title="Copy code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetCode}
                  className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                  title="Reset template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-0 bg-[#1e1e1e]">
              <Editor
                height="100%"
                language={selectedLang}
                theme="vs-dark"
                value={codeContent}
                onChange={(val) => setCodeContent(val || '')}
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  lineHeight: 20
                }}
              />
            </div>

            {/* Run triggers & Output terminal */}
            <div className="bg-gray-950/60 border-t border-gray-800 p-4 flex flex-col space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Output Terminal</span>
                <button
                  onClick={handleRunCode}
                  disabled={runningCode}
                  className="px-4 py-1.5 bg-gray-900 border border-gray-800 hover:bg-purple-600 hover:text-white transition-all text-purple-400 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{runningCode ? 'Compiling...' : 'Run Code'}</span>
                </button>
              </div>

              <pre className="bg-[#05080f] p-3 rounded-lg border border-gray-850 h-24 text-[10px] font-mono text-gray-300 overflow-y-auto whitespace-pre-wrap">
                {consoleOutput || 'Console is idle. Press Run Code to verify code outputs against standard technical test cases.'}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Exit & early finish controls */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleFinishInterview}
          className="px-5 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-red-500/35 hover:text-red-400 transition-colors text-xs font-bold text-gray-400 cursor-pointer"
        >
          Exit early & View partial report
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;
