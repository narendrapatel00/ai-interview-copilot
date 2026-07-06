import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { extractErrorMessage } from '../services/api';
import { HelpCircle, ShieldAlert, Award, Compass, Play } from 'lucide-react';

const InterviewSetup: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('Software Engineer');
  const [customRole, setCustomRole] = useState('');
  const [company, setCompany] = useState('Standard');
  const [difficulty, setDifficulty] = useState('Medium');
  const [timer, setTimer] = useState('30');
  const [useResume, setUseResume] = useState(true);
  const [hasResume, setHasResume] = useState(false);
  const [resumeFilename, setResumeFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    'Software Engineer',
    'AI Engineer',
    'ML Engineer',
    'Backend Developer',
    'Frontend Developer',
    'Data Scientist',
    'Full Stack Developer',
    'Cloud Engineer',
    'DevOps',
    'Custom Role'
  ];

  const companies = [
    'Standard',
    'Google',
    'Microsoft',
    'Amazon',
    'Meta',
    'OpenAI',
    'Anthropic',
    'Netflix',
    'Uber',
    'Adobe'
  ];

  useEffect(() => {
    // Check if user has uploaded a resume
    const checkResume = async () => {
      try {
        const response = await api.get('/resume/latest');
        if (response.data && response.data.id) {
          setHasResume(true);
          setResumeFilename(response.data.filename);
        } else {
          setHasResume(false);
          setUseResume(false);
        }
      } catch (err) {
        console.error('Error fetching resume info:', err);
      }
    };
    checkResume();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const chosenRole = role === 'Custom Role' ? customRole : role;
    if (role === 'Custom Role' && !customRole.trim()) {
      setError('Please specify a custom target role.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/interview/start', {
        role: `${chosenRole} (${company} Template)`,
        difficulty,
        time_limit: parseInt(timer, 10),
        use_resume: useResume
      });
      
      const { session_id } = response.data;
      navigate(`/dashboard/interview/${session_id}`);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Configure Interview Room</h1>
        <p className="text-sm text-gray-400">
          Tailor difficulty, template contexts, and matching criteria. The AI will customize coding, technical, and system design challenges for you.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Setup Form */}
      <form onSubmit={handleSubmit} className="space-y-6 glass-effect p-8 rounded-2xl border border-gray-850/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Target Interview Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900/60 border border-gray-800 focus:border-purple-500/60 text-white text-sm focus:outline-none transition-all"
            >
              {roles.map((r, i) => (
                <option key={i} value={r} className="bg-[#0b0f19]">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Company Templates */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Company Interview Style
            </label>
            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900/60 border border-gray-800 focus:border-purple-500/60 text-white text-sm focus:outline-none transition-all"
            >
              {companies.map((c, i) => (
                <option key={i} value={c} className="bg-[#0b0f19]">
                  {c === 'Standard' ? 'Standard Technical Style' : `${c} Mock template`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom role input field */}
        {role === 'Custom Role' && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Specify Target Custom Role
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lead Robotics Engineer, Bio-ML Developer"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900/60 border border-gray-800 focus:border-purple-500/60 text-white placeholder-gray-600 text-sm focus:outline-none transition-all"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Difficulty Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Difficulty Tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/60 shadow-inner'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-850/40'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Time limits Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Session Time Limit
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['20', '30', '45', '60'].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTimer(mins)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    timer === mins
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/60 shadow-inner'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-850/40'
                  }`}
                >
                  {mins} Min
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resume linkage toggle */}
        <div className="p-4 rounded-xl bg-gray-950/20 border border-gray-850/80 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Generate Questions Using Resume Context</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Questions will draw from projects, skills, and experience listed in your PDF resume.
              </p>
            </div>
            <input
              type="checkbox"
              disabled={!hasResume}
              checked={useResume}
              onChange={(e) => setUseResume(e.target.checked)}
              className="w-4.5 h-4.5 accent-purple-500 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {hasResume ? (
            <div className="flex items-center space-x-1.5 text-[10px] text-purple-400 font-semibold bg-purple-950/10 px-2 py-1 rounded w-fit border border-purple-500/10">
              <Compass className="w-3.5 h-3.5" />
              <span>Context: {resumeFilename}</span>
            </div>
          ) : (
            <div className="text-[10px] text-yellow-500 flex items-center space-x-1">
              <Award className="w-3.5 h-3.5" />
              <span>No resume found. AI will generate standard mock questions for the chosen role.</span>
            </div>
          )}
        </div>

        {/* Start button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current animate-pulse" />
          <span>{loading ? 'Assembling AI Panel...' : 'Launch Live Session'}</span>
        </button>
      </form>

      {/* Helpful tips panel */}
      <div className="p-5 rounded-2xl bg-gray-900/20 border border-gray-850/80 flex items-start space-x-3.5">
        <HelpCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white">How the Interview room works:</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Once you launch, the system connects your microphone and displays the code terminal. You will receive 5 core questions. For coding queries, write and compile logic in the Monaco panel. Speak using Voice mode or type answers in Text mode. Submitting an answer triggers real-time grading before advancing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
