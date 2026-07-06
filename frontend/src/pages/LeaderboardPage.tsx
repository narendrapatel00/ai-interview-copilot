import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Flame, Zap } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  username: string;
  xp: number;
  level: number;
  streak: number;
  is_self: boolean;
}

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRankTab, setActiveRankTab] = useState<'global' | 'college' | 'weekly'>('global');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/analytics/leaderboard');
        setLeaderboard(response.data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const collegeList = [
    { rank: 1, name: 'Stanford University', active_users: 184, avg_score: 84.6 },
    { rank: 2, name: 'Massachusetts Institute of Technology', active_users: 210, avg_score: 83.2 },
    { rank: 3, name: 'Indian Institute of Technology, Delhi', active_users: 412, avg_score: 81.9 },
    { rank: 4, name: 'University of California, Berkeley', active_users: 154, avg_score: 79.5 },
    { rank: 5, name: 'Carnegie Mellon University', active_users: 132, avg_score: 78.4 }
  ];

  const weeklyChallengers = [
    { rank: 1, username: 'Elena Rostova', xp: 840, challenge_badges: 3 },
    { rank: 2, username: 'Rajesh Sharma', xp: 750, challenge_badges: 2 },
    { rank: 3, username: 'Michael Chang', xp: 620, challenge_badges: 2 }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded-lg" />
        <div className="h-96 bg-gray-900 rounded-2xl border border-gray-850" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Global Ranking & Milestones</h1>
        <p className="text-sm text-gray-400">
          Rank against developers worldwide. Complete interviews under timer thresholds to maximize XP scores.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Score Board lists */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab selectors */}
          <div className="flex border-b border-gray-800 space-x-6">
            <button
              onClick={() => setActiveRankTab('global')}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeRankTab === 'global' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Global Leaderboard
              {activeRankTab === 'global' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>

            <button
              onClick={() => setActiveRankTab('college')}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeRankTab === 'college' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              College Standings
              {activeRankTab === 'college' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>

            <button
              onClick={() => setActiveRankTab('weekly')}
              className={`pb-3 text-xs font-bold transition-all relative ${
                activeRankTab === 'weekly' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Weekly Sprint
              {activeRankTab === 'weekly' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          </div>

          {/* List contents */}
          <div className="glass-effect rounded-2xl border border-gray-850/80 overflow-hidden shadow-md">
            {activeRankTab === 'global' && (
              <div className="divide-y divide-gray-850">
                {/* Header row */}
                <div className="p-4 bg-gray-950/40 grid grid-cols-12 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-5">Candidate Name</div>
                  <div className="col-span-2 text-center">Level</div>
                  <div className="col-span-1 text-center">Streak</div>
                  <div className="col-span-2 text-right">Total XP</div>
                </div>

                {leaderboard.map((item) => (
                  <div 
                    key={item.rank}
                    className={`p-4 grid grid-cols-12 items-center text-xs ${
                      item.is_self 
                        ? 'bg-purple-600/10 text-purple-300 font-bold border-l-4 border-purple-500' 
                        : 'text-gray-300'
                    }`}
                  >
                    <div className="col-span-2 text-center flex items-center justify-center font-black">
                      {item.rank === 1 ? (
                        <Trophy className="w-4.5 h-4.5 text-yellow-500 filter drop-shadow-[0_2px_4px_rgba(234,179,8,0.2)]" />
                      ) : item.rank === 2 ? (
                        <Trophy className="w-4 h-4 text-gray-400" />
                      ) : item.rank === 3 ? (
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      ) : (
                        <span>#{item.rank}</span>
                      )}
                    </div>

                    <div className="col-span-5 flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center font-bold text-[10px] text-white">
                        {item.username.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{item.username}</span>
                    </div>

                    <div className="col-span-2 text-center font-mono font-semibold">
                      Lvl {item.level}
                    </div>

                    <div className="col-span-1 text-center flex items-center justify-center text-orange-500">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold ml-0.5">{item.streak}</span>
                    </div>

                    <div className="col-span-2 text-right font-black font-mono">
                      {item.xp.toLocaleString()} XP
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeRankTab === 'college' && (
              <div className="divide-y divide-gray-850">
                <div className="p-4 bg-gray-950/40 grid grid-cols-12 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-5">University Name</div>
                  <div className="col-span-3 text-center">Active Learners</div>
                  <div className="col-span-2 text-right">Avg Score</div>
                </div>

                {collegeList.map((item) => (
                  <div key={item.rank} className="p-4 grid grid-cols-12 items-center text-xs text-gray-300">
                    <div className="col-span-2 text-center font-black">#{item.rank}</div>
                    <div className="col-span-5 font-bold truncate">{item.name}</div>
                    <div className="col-span-3 text-center font-semibold text-purple-400">{item.active_users}</div>
                    <div className="col-span-2 text-right font-black font-mono text-emerald-400">{item.avg_score}%</div>
                  </div>
                ))}
              </div>
            )}

            {activeRankTab === 'weekly' && (
              <div className="divide-y divide-gray-850">
                <div className="p-4 bg-gray-950/40 grid grid-cols-12 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                  <div className="col-span-2 text-center">Rank</div>
                  <div className="col-span-5">Challenger Name</div>
                  <div className="col-span-3 text-center">Challenge Badges</div>
                  <div className="col-span-2 text-right">Sprint XP</div>
                </div>

                {weeklyChallengers.map((item) => (
                  <div key={item.rank} className="p-4 grid grid-cols-12 items-center text-xs text-gray-300">
                    <div className="col-span-2 text-center font-black">#{item.rank}</div>
                    <div className="col-span-5 font-bold truncate">{item.username}</div>
                    <div className="col-span-3 text-center font-semibold text-yellow-500">+{item.challenge_badges}</div>
                    <div className="col-span-2 text-right font-black font-mono text-purple-400">+{item.xp} XP</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Achievements panel */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-850/80 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Your Stats Summary</h3>
            {user && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Global Rank Position:</span>
                  <span className="font-black text-white">#84</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">XP Accumulated:</span>
                  <span className="font-black text-purple-400 font-mono">{user.xp} XP</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">User Level:</span>
                  <span className="font-black text-purple-300">Level {user.level}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Current Streak:</span>
                  <span className="font-black text-orange-400 flex items-center space-x-0.5">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{user.streak} Days</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Gamification tips */}
          <div className="p-6 rounded-2xl bg-purple-950/10 border border-purple-500/10 space-y-3">
            <h4 className="text-xs font-bold text-purple-300 flex items-center space-x-1.5">
              <Zap className="w-4 h-4 fill-purple-500/25" />
              <span>Double XP Milestones</span>
            </h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Unlock the <span className="text-white font-bold">3-Day Burn</span> badge by practicing three consecutive days. Completing high-difficulty rounds scales XP multiplication rewards up to 2.5x.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
