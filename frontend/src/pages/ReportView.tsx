import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Download, 
  BookOpen, 
  ChevronRight, 
  ChevronDown, 
  Bookmark, 
  Code2, 
  ShieldCheck, 
  BookmarkCheck,
  RotateCcw
} from 'lucide-react';

interface QuestionAnswer {
  id: number;
  question_text: string;
  category: string;
  order_index: number;
  code_template: string | null;
  bookmarked: boolean;
  answer: {
    answer_text: string;
    code_submitted: string | null;
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
  } | null;
}

interface SessionReport {
  id: number;
  role: string;
  difficulty: string;
  time_limit: number;
  overall_score: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  problem_solving_score: number;
  summary: string;
  roadmap: Array<{
    topic: string;
    status: string;
    steps: string[];
    resources: string[];
  }>;
  recommended_topics: string[];
  xp_gained: number;
}

const ReportView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [report, setReport] = useState<SessionReport | null>(null);
  const [questions, setQuestions] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openQuestionIdx, setOpenQuestionIdx] = useState<number | null>(0);
  const [savedBookmarkId, setSavedBookmarkId] = useState<number | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.get(`/interview/session/${id}`);
        setReport(response.data.session);
        setQuestions(response.data.questions);
      } catch (err) {
        setError('Failed to load session report data.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleToggleBookmark = async (qId: number) => {
    try {
      const response = await api.post(`/interview/session/bookmark/${qId}`);
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, bookmarked: response.data.bookmarked } : q));
      setSavedBookmarkId(qId);
      setTimeout(() => setSavedBookmarkId(null), 1500);
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-purple-500/20 animate-pulse">
          Co
        </div>
        <p className="text-gray-400 text-xs font-semibold tracking-wide">Compiling feedback matrices...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-400 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <ShieldCheck className="w-10 h-10 text-red-500" />
        <h3 className="text-sm font-bold text-white font-mono">Report Compile Fail</h3>
        <p className="text-xs text-gray-400">{error || 'Session report details are missing.'}</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-purple-600 rounded-lg text-xs font-bold text-white hover:bg-purple-500">
          Go to Dashboard
        </button>
      </div>
    );
  }

  const radarData = [
    { subject: 'Technical', value: report.technical_score, fullMark: 100 },
    { subject: 'Communication', value: report.communication_score, fullMark: 100 },
    { subject: 'Confidence', value: report.confidence_score, fullMark: 100 },
    { subject: 'Problem Solving', value: report.problem_solving_score, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 print:p-0 print:bg-white print:text-black">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-850 pb-4 print:hidden">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 bg-purple-950/30 px-3 py-1 rounded-full border border-purple-500/10">
            Performance Assessment Sheet
          </span>
          <h1 className="text-2xl font-black text-white mt-2">
            {report.role} Report
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Difficulty: <span className="text-purple-400 font-bold">{report.difficulty}</span> • Timed Session
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard/interview/setup"
            className="px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Practice Again</span>
          </Link>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main stats card grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Score Summary & Radar */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Overall Score box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/10 to-indigo-950/15 border border-purple-500/20 shadow-lg flex flex-col justify-between">
              <div>
                <span className="text-[8px] bg-purple-600 text-white px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  Overall
                </span>
                <h3 className="text-4xl font-black text-white mt-4">{report.overall_score}%</h3>
                <p className="text-xs text-gray-400 mt-1">Weighted assessment rating</p>
              </div>
              <span className="text-[10px] text-purple-400 font-semibold mt-4 flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span>Awarded +{report.xp_gained} XP Points</span>
              </span>
            </div>

            {/* AI Summary card */}
            <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 flex flex-col justify-between">
              <div>
                <span className="text-[8px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  AI Review
                </span>
                <p className="text-xs text-gray-300 leading-relaxed mt-4 italic">
                  "{report.summary}"
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <BookOpen className="w-4.5 h-4.5 text-purple-400" />
              <span>Response-by-Response Review</span>
            </h3>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div 
                  key={q.id}
                  className="rounded-2xl border bg-gray-900/40 overflow-hidden transition-all duration-200 border-gray-850"
                >
                  {/* Header click bar */}
                  <div 
                    onClick={() => setOpenQuestionIdx(openQuestionIdx === idx ? null : idx)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/20 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5 overflow-hidden">
                      <span className="w-6 h-6 rounded-lg bg-gray-850 flex items-center justify-center font-bold text-xs text-purple-400">
                        {q.order_index}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate max-w-lg">
                        {q.question_text}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-4 pl-4">
                      {q.answer ? (
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-950/40 border border-purple-500/10 px-2.5 py-0.5 rounded-lg">
                          Score: {q.answer.technical_score}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-yellow-500 bg-yellow-950/20 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                          Unanswered
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openQuestionIdx === idx ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Body expansion */}
                  {openQuestionIdx === idx && (
                    <div className="p-6 border-t border-gray-850 space-y-4 bg-gray-950/20">
                      {q.answer ? (
                        <>
                          {/* Answer texts */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                              <span className="text-[9px] uppercase font-bold text-purple-400">Your Answer:</span>
                              <p className="text-xs text-gray-300 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800 h-28 overflow-y-auto whitespace-pre-wrap">
                                {q.answer.answer_text}
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <span className="text-[9px] uppercase font-bold text-purple-400">Model Correct Answer:</span>
                              <p className="text-xs text-gray-300 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800 h-28 overflow-y-auto whitespace-pre-wrap">
                                {q.answer.correct_answer}
                              </p>
                            </div>
                          </div>

                          {/* Code Submitted (if applicable) */}
                          {q.answer.code_submitted && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] uppercase font-bold text-purple-400 flex items-center space-x-1">
                                <Code2 className="w-3.5 h-3.5" />
                                <span>Code Submitted:</span>
                              </span>
                              <pre className="p-4 rounded-xl bg-[#1e1e1e] border border-gray-800 text-[10px] font-mono text-gray-300 overflow-x-auto">
                                {q.answer.code_submitted}
                              </pre>
                            </div>
                          )}

                          {/* STAR analysis for behavioral */}
                          {q.answer.star_feedback && (
                            <div className="p-4 rounded-xl bg-purple-950/15 border border-purple-500/10 space-y-2">
                              <span className="text-[9px] text-purple-400 font-bold uppercase">STAR Methodology Checklist:</span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px]">
                                <div>
                                  <span className="text-purple-400 font-semibold">Situation:</span>
                                  <p className="text-gray-400">{q.answer.star_feedback.situation}</p>
                                </div>
                                <div>
                                  <span className="text-purple-400 font-semibold">Task:</span>
                                  <p className="text-gray-400">{q.answer.star_feedback.task}</p>
                                </div>
                                <div>
                                  <span className="text-purple-400 font-semibold">Action:</span>
                                  <p className="text-gray-400">{q.answer.star_feedback.action}</p>
                                </div>
                                <div>
                                  <span className="text-purple-400 font-semibold">Result:</span>
                                  <p className="text-gray-400">{q.answer.star_feedback.result}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Improvement Suggestions */}
                          <div className="space-y-2 pt-2">
                            <span className="text-[10px] text-purple-400 font-bold uppercase">Evaluator Critique:</span>
                            <p className="text-xs text-gray-300 leading-relaxed">{q.answer.feedback_text}</p>
                            <div className="space-y-1.5 pt-1">
                              {q.answer.suggestions.map((sug, sIdx) => (
                                <div key={sIdx} className="text-xs text-gray-400 flex items-start space-x-1.5">
                                  <ChevronRight className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                                  <span>{sug}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Bookmark controls */}
                          <div className="pt-3 border-t border-gray-850/50 flex justify-between items-center">
                            <button
                              onClick={() => handleToggleBookmark(q.id)}
                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                q.bookmarked 
                                  ? 'bg-purple-600/15 border-purple-500 text-purple-400'
                                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white'
                              }`}
                            >
                              <Bookmark className="w-3 h-3 fill-current" />
                              <span>{q.bookmarked ? 'Saved to Bookmarks' : 'Bookmark Question'}</span>
                            </button>

                            {savedBookmarkId === q.id && (
                              <span className="text-[9px] text-emerald-400 font-bold flex items-center space-x-1">
                                <BookmarkCheck className="w-3.5 h-3.5 animate-bounce" />
                                <span>Bookmark state updated!</span>
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-6 text-xs text-gray-500">
                          This question was skipped or not answered. Ensure you type or record answers to review score critiquing.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Radar Chart & AI Career Roadmap */}
        <div className="space-y-6">
          {/* Radar chart */}
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 flex flex-col items-center">
            <h3 className="text-xs font-bold text-white self-start mb-4">Performance Radar</h3>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4b5563" fontSize={9} />
                  <Radar name="Scoring" dataKey="value" stroke="#a78bfa" fill="#8b5cf6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Career Roadmap */}
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4.5 h-4.5 text-purple-400" />
              <span>AI Career Roadmap & Next Steps</span>
            </h3>
            
            <div className="space-y-4">
              {report.roadmap && report.roadmap.length > 0 ? (
                report.roadmap.map((road, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-extrabold text-white">{road.topic}</span>
                      <span className="text-red-400 bg-red-950/20 px-2 py-0.5 rounded font-bold border border-red-500/10">
                        {road.status}
                      </span>
                    </div>

                    <ul className="space-y-1.5 pl-3 border-l-2 border-purple-500/30">
                      {road.steps.map((step, sIdx) => (
                        <li key={sIdx} className="text-[11px] text-gray-400 leading-relaxed">
                          • {step}
                        </li>
                      ))}
                    </ul>

                    {/* Resources */}
                    {road.resources && road.resources.length > 0 && (
                      <div className="pl-3 text-[9px] text-purple-400 font-semibold">
                        Resources: {road.resources.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">
                  Completing interviews will automatically populate personalized roadmaps based on weakness gaps.
                </div>
              )}
            </div>
          </div>

          {/* Recommended Topics */}
          {report.recommended_topics && report.recommended_topics.length > 0 && (
            <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 space-y-3">
              <h3 className="text-xs font-bold text-white">Recommended Study Areas</h3>
              <div className="flex flex-wrap gap-2">
                {report.recommended_topics.map((t, idx) => (
                  <span 
                    key={idx}
                    className="text-[9px] text-purple-300 bg-purple-950/30 border border-purple-500/15 px-2.5 py-1 rounded-lg"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportView;
