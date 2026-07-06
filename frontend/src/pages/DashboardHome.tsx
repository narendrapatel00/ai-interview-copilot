import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  Trophy, 
  Award, 
  Flame, 
  ChevronRight, 
  Play, 
  Plus, 
  Bookmark 
} from 'lucide-react';

interface DashboardStats {
  total_interviews: number;
  average_score: number;
  best_score: number;
  xp: number;
  level: number;
  streak: number;
  recent_activity: Array<{
    id: number;
    role: string;
    difficulty: string;
    overall_score: number | null;
    status: string;
    created_at: string;
  }>;
  category_scores: {
    technical: number;
    communication: number;
    confidence: number;
    problem_solving: number;
  };
  weekly_progress: Array<{
    day: string;
    count: number;
    average_score: number;
  }>;
  badges: Array<{
    name: string;
    description: string;
    icon: string;
    unlocked_at: string;
  }>;
  bookmarks: Array<{
    id: number;
    question_text: string;
    category: string;
    session_id: number;
    role: string;
  }>;
}

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900 rounded-2xl border border-gray-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-80 bg-gray-900 rounded-2xl border border-gray-800" />
          <div className="h-80 bg-gray-900 rounded-2xl border border-gray-800" />
        </div>
      </div>
    );
  }

  // Format Recharts data for radar
  const radarData = [
    { subject: 'Technical', value: stats.category_scores.technical, fullMark: 100 },
    { subject: 'Communication', value: stats.category_scores.communication, fullMark: 100 },
    { subject: 'Confidence', value: stats.category_scores.confidence, fullMark: 100 },
    { subject: 'Problem Solving', value: stats.category_scores.problem_solving, fullMark: 100 },
  ];

  return (
    <div className="space-y-8 text-gray-100">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-sm text-gray-400">
            Let's prepare for your next interview round. Your current rank streak is active.
          </p>
        </div>

        <Link
          to="/dashboard/interview/setup"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all self-start md:self-auto cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start New Interview</span>
        </Link>
      </div>

      {/* Stats cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-850/80 shadow-md">
          <div className="flex items-center justify-between mb-3 text-purple-400">
            <Trophy className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Practice</span>
          </div>
          <h3 className="text-2xl font-black text-white">{stats.total_interviews}</h3>
          <p className="text-xs text-gray-400 mt-1">Interviews completed</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-850/80 shadow-md">
          <div className="flex items-center justify-between mb-3 text-emerald-400">
            <Award className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Quality</span>
          </div>
          <h3 className="text-2xl font-black text-white">
            {stats.average_score > 0 ? `${stats.average_score}%` : 'N/A'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Average performance score</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-850/80 shadow-md">
          <div className="flex items-center justify-between mb-3 text-indigo-400">
            <Award className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Peak</span>
          </div>
          <h3 className="text-2xl font-black text-white">
            {stats.best_score > 0 ? `${stats.best_score}%` : 'N/A'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Personal best score</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-850/80 shadow-md">
          <div className="flex items-center justify-between mb-3 text-orange-500">
            <Flame className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Consistency</span>
          </div>
          <h3 className="text-2xl font-black text-white">{stats.streak} Days</h3>
          <p className="text-xs text-gray-400 mt-1">Daily practice streak</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress Bar Chart */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">Weekly Practice Log</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={stats.weekly_progress}>
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', borderRadius: '8px', color: '#fff' }}
                  labelClassName="text-xs font-bold"
                  itemStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} name="Interviews" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Category Radar Chart */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white mb-2">Category Matrix</h3>
          <div className="h-56 flex items-center justify-center">
            {stats.total_interviews > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4b5563" fontSize={9} />
                  <Radar name="Performance" dataKey="value" stroke="#a78bfa" fill="#8b5cf6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-gray-500">
                Complete your first interview to generate radar stats.
              </div>
            )}
          </div>
          <div className="text-[10px] text-gray-500 text-center">
            Refine communication & code syntax to expand your matrix volume.
          </div>
        </div>
      </div>

      {/* Lower Grid: History, Badges, and Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Interviews list */}
        <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Interview Sessions</h3>
            <Link to="/dashboard/interview/setup" className="text-xs text-purple-400 hover:underline flex items-center space-x-0.5">
              <span>View History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-850">
            {stats.recent_activity.length > 0 ? (
              stats.recent_activity.map((session) => (
                <div key={session.id} className="py-3 flex items-center justify-between group first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                      {session.role}
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      Difficulty: <span className="text-purple-400 font-semibold">{session.difficulty}</span> • {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    {session.status === 'completed' ? (
                      <>
                        <span className="text-xs font-black text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-500/15">
                          {session.overall_score}%
                        </span>
                        <Link 
                          to={`/dashboard/report/${session.id}`}
                          className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] text-yellow-500 bg-yellow-950/20 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                          Incomplete
                        </span>
                        <Link 
                          to={`/dashboard/interview/${session.id}`}
                          className="p-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-semibold text-xs px-3 py-1 transition-colors"
                        >
                          Resume
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-500 space-y-3">
                <p>No interviews completed yet.</p>
                <Link to="/dashboard/interview/setup" className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-purple-400 text-xs font-bold hover:bg-gray-800">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Start your first round</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Milestones & Badges / Bookmarks Column */}
        <div className="space-y-6">
          {/* Bookmarks */}
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Bookmark className="w-4 h-4 text-purple-400" />
              <span>Bookmarked Questions</span>
            </h3>

            <div className="divide-y divide-gray-850">
              {stats.bookmarks && stats.bookmarks.length > 0 ? (
                stats.bookmarks.map((b) => (
                  <div key={b.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col space-y-1">
                    <Link 
                      to={`/dashboard/interview/${b.session_id}`}
                      className="text-xs text-gray-300 hover:text-purple-400 truncate transition-colors font-medium"
                    >
                      {b.question_text}
                    </Link>
                    <div className="flex items-center justify-between text-[8px] text-gray-500">
                      <span>{b.role}</span>
                      <span className="uppercase text-purple-500 font-semibold">{b.category}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-500">
                  Bookmark questions during mock rounds to save them here for study sessions.
                </div>
              )}
            </div>
          </div>

          {/* Badges unlocked */}
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 space-y-4">
            <h3 className="text-sm font-bold text-white">Milestones & Achievements</h3>
            <div className="grid grid-cols-4 gap-4">
              {stats.badges.length > 0 ? (
                stats.badges.map((badge, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-950/40 border border-gray-800/60 text-center group relative cursor-help"
                    title={`${badge.name}: ${badge.description}`}
                  >
                    <span className="text-2xl filter drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)]">{badge.icon}</span>
                    <span className="text-[8px] text-gray-400 font-semibold truncate max-w-full mt-1.5">{badge.name}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-center py-4 text-xs text-gray-500">
                  Achievements show up here as you complete rounds and streaks!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
