import React, { useState, useEffect } from 'react';
import api, { extractErrorMessage } from '../services/api';
import { 
  Upload, 
  FileCheck, 
  AlertCircle, 
  Copy, 
  Check, 
  Sparkles, 
  ChevronRight, 
  Download, 
  User, 
  Code 
} from 'lucide-react';

interface ResumeData {
  id: number;
  filename: string;
  parsed_text: string;
  ats_score: number;
  skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  project_suggestions: Array<{ title: string; description: string }>;
  resume_summary: string;
  improvement_suggestions: string[];
  optimized_summary?: string;
  optimized_projects?: Array<{
    original_title: string;
    optimized_title: string;
    bullets: string[];
  }>;
}

const ResumeAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'optimize' | 'projects'>('analysis');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Load latest resume on mount
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const response = await api.get('/resume/latest');
        if (response.data && response.data.id) {
          setResume(response.data);
        }
      } catch (err) {
        console.error('Failed to load latest resume:', err);
      }
    };
    fetchLatest();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResume(response.data);
      setSuccess('Resume analyzed successfully!');
      setActiveTab('analysis');
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!resume) return;

    setOptimizing(true);
    setError('');
    try {
      const response = await api.post(`/resume/optimize/${resume.id}`);
      setResume({
        ...resume,
        optimized_summary: response.data.optimized_summary,
        optimized_projects: response.data.optimized_projects
      });
      setActiveTab('optimize');
    } catch (err: any) {
      setError('Failed to optimize resume with AI.');
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadOptimized = () => {
    if (!resume || !resume.optimized_summary) return;

    let docContent = `AI INTERVIEW COPILOT - OPTIMIZED RESUME DATA\n`;
    docContent += `==============================================\n\n`;
    docContent += `OPTIMIZED PROFESSIONAL SUMMARY:\n`;
    docContent += `-------------------------------\n`;
    docContent += `${resume.optimized_summary}\n\n`;
    
    if (resume.optimized_projects) {
      docContent += `OPTIMIZED PROJECTS (STAR METHOD):\n`;
      docContent += `---------------------------------\n`;
      resume.optimized_projects.forEach((proj, idx) => {
        docContent += `${idx + 1}. ${proj.optimized_title} (Original: ${proj.original_title})\n`;
        proj.bullets.forEach(bullet => {
          docContent += `   • ${bullet}\n`;
        });
        docContent += `\n`;
      });
    }

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimized_${resume.filename.replace('.pdf', '.txt')}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">AI Resume Analyzer & Optimizer</h1>
        <p className="text-sm text-gray-400">
          Upload your resume PDF to fetch your ATS compatibility score, identify technical gaps, and generate STAR-formatted bullets.
        </p>
      </div>

      {/* Grid: Upload & Current PDF Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload card */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 shadow-md h-fit">
          <h3 className="text-sm font-bold text-white mb-4">Upload Resume (PDF)</h3>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <label className="border-2 border-dashed border-gray-850 hover:border-purple-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-gray-950/20 group">
              <Upload className="w-8 h-8 text-gray-500 group-hover:text-purple-400 mb-2 transition-colors" />
              <span className="text-xs font-semibold text-gray-300">
                {file ? file.name : 'Choose a PDF file'}
              </span>
              <span className="text-[10px] text-gray-500 mt-1">PDF format (Max 4MB)</span>
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileChange} 
              />
            </label>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-300 text-xs flex items-center space-x-2">
                <FileCheck className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Analyzing with AI...' : 'Scan Resume'}</span>
            </button>
          </form>

          {resume && (
            <div className="mt-6 pt-6 border-t border-gray-850 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Scanned Resume:</span>
                <span className="text-white font-bold truncate max-w-[150px]">{resume.filename}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">ATS Match Rating:</span>
                <span className={`font-black ${resume.ats_score > 75 ? 'text-emerald-400' : 'text-yellow-500'}`}>
                  {resume.ats_score}%
                </span>
              </div>

              {!resume.optimized_summary && (
                <button
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="w-full py-2 rounded-xl border border-purple-500/40 hover:bg-purple-500/10 text-purple-300 font-bold text-xs flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{optimizing ? 'Rewriting with AI...' : 'Optimize Resume Summary & Projects'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Details & Output tabs */}
        <div className="lg:col-span-2 flex flex-col">
          {resume ? (
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Tab selectors */}
              <div className="flex border-b border-gray-800 space-x-6">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`pb-3 text-xs font-bold transition-all relative ${
                    activeTab === 'analysis' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ATS Scan Report
                  {activeTab === 'analysis' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                  )}
                </button>

                {resume.optimized_summary && (
                  <button
                    onClick={() => setActiveTab('optimize')}
                    className={`pb-3 text-xs font-bold transition-all relative ${
                      activeTab === 'optimize' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    AI Rewrite Engine
                    {activeTab === 'optimize' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('projects')}
                  className={`pb-3 text-xs font-bold transition-all relative ${
                    activeTab === 'projects' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ATS Suggested Projects
                  {activeTab === 'projects' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                  )}
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1">
                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    {/* Progress Circle & Missing Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 rounded-xl bg-gray-900/30 border border-gray-850/80 flex flex-col items-center justify-center text-center">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          {/* Radial Progress SVG */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="#1f2937" strokeWidth="8" fill="transparent" />
                            <circle 
                              cx="56" 
                              cy="56" 
                              r="48" 
                              stroke="#8b5cf6" 
                              strokeWidth="8" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 48}
                              strokeDashoffset={2 * Math.PI * 48 * (1 - resume.ats_score / 100)}
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-xl font-black text-white">{resume.ats_score}%</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">ATS Score</span>
                          </div>
                        </div>
                      </div>

                      {/* Missing Skills list */}
                      <div className="md:col-span-2 p-5 rounded-xl bg-gray-900/30 border border-gray-850/80 space-y-3">
                        <h4 className="text-xs font-bold text-white">Suggested Missing Skills</h4>
                        <p className="text-[10px] text-gray-400">
                          ATS scan matched these critical technologies as missing based on your experience. Consider acquiring or listing them:
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {resume.missing_skills?.map((skill, i) => (
                            <span 
                              key={i} 
                              className="text-[10px] text-red-300 bg-red-950/20 px-2.5 py-1 rounded-lg border border-red-500/15"
                            >
                              + {skill}
                            </span>
                          ))}
                          {resume.skills && (
                            <div className="w-full pt-3 mt-1 border-t border-gray-850/50 flex flex-wrap gap-1.5">
                              <span className="text-[9px] text-gray-500 font-bold uppercase w-full">Detected Skills:</span>
                              {resume.skills.slice(0, 8).map((sk, i) => (
                                <span key={i} className="text-[9px] text-purple-300 bg-purple-950/20 px-2 py-0.5 rounded-md border border-purple-500/10">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 rounded-xl bg-gray-900/30 border border-gray-850/80 space-y-3">
                        <h4 className="text-xs font-bold text-emerald-400">Strengths Detected</h4>
                        <ul className="space-y-2 text-xs text-gray-300 list-disc list-inside">
                          {resume.strengths?.map((str, i) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-5 rounded-xl bg-gray-900/30 border border-gray-850/80 space-y-3">
                        <h4 className="text-xs font-bold text-red-400">Critique Points</h4>
                        <ul className="space-y-2 text-xs text-gray-300 list-disc list-inside">
                          {resume.weaknesses?.map((weak, i) => (
                            <li key={i}>{weak}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Improvement Suggestions list */}
                    <div className="p-5 rounded-xl bg-gray-900/30 border border-gray-850/80 space-y-3">
                      <h4 className="text-xs font-bold text-purple-400">Actionable Suggestions</h4>
                      <div className="space-y-2.5">
                        {resume.improvement_suggestions?.map((sug, i) => (
                          <div key={i} className="text-xs text-gray-300 flex items-start space-x-2">
                            <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>{sug}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'optimize' && resume.optimized_summary && (
                  <div className="space-y-6">
                    {/* Header bar */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">
                        STAR Optimization Rewrites
                      </span>
                      <button
                        onClick={handleDownloadOptimized}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Optimized Text</span>
                      </button>
                    </div>

                    {/* Summary rewrite */}
                    <div className="p-5 rounded-xl bg-gray-900/30 border border-gray-850/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                          <User className="w-4 h-4 text-purple-400" />
                          <span>Optimized Profile Summary</span>
                        </h4>
                        <button
                          onClick={() => handleCopy(resume.optimized_summary || '', 'summary')}
                          className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                          title="Copy Summary"
                        >
                          {copiedText === 'summary' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed bg-gray-950/20 p-3 rounded-lg border border-gray-850">
                        {resume.optimized_summary}
                      </p>
                    </div>

                    {/* Project rewrites */}
                    {resume.optimized_projects && resume.optimized_projects.map((proj, idx) => (
                      <div key={idx} className="p-5 rounded-xl bg-gray-900/30 border border-gray-850/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[8px] bg-purple-950/50 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold uppercase">
                              Project {idx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-1">
                              {proj.optimized_title}
                            </h4>
                            <p className="text-[9px] text-gray-500 mt-0.5">Original: {proj.original_title}</p>
                          </div>
                          <button
                            onClick={() => handleCopy(proj.bullets.join('\n'), `proj-${idx}`)}
                            className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Copy Bullet Points"
                          >
                            {copiedText === `proj-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <ul className="space-y-2 bg-gray-950/20 p-3 rounded-lg border border-gray-850">
                          {proj.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="text-xs text-gray-300 flex items-start space-x-2">
                              <span className="text-purple-400 mt-0.5 font-bold">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Code className="w-4.5 h-4.5 text-purple-400" />
                      <span>Suggested Portfolio Projects</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 -mt-3">
                      Build these project templates to acquire missing technical credentials and boost your resume ATS match rate.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {resume.project_suggestions?.map((proj, idx) => (
                        <div key={idx} className="p-5 rounded-xl bg-gray-900/30 border border-gray-850/80 flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-purple-400">
                              {proj.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                              {proj.description}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold text-purple-400 flex items-center space-x-0.5 uppercase tracking-wide self-end">
                            <span>Ready to implement</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 glass-effect rounded-2xl h-80">
              <Upload className="w-12 h-12 text-gray-600 mb-3 animate-bounce" />
              <h3 className="text-sm font-bold text-white">No Resume Scanned Yet</h3>
              <p className="text-xs text-gray-500 max-w-xs mt-2">
                Use the scanner card to analyze your first resume PDF and unlock ATS analytics reviews.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
