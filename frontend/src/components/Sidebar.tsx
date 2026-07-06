import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Video, 
  Trophy, 
  BookOpen, 
  Shield, 
  LogOut, 
  Flame, 
  Award 
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/resume', label: 'Resume Analyzer', icon: FileText },
    { to: '/dashboard/interview/setup', label: 'New Interview', icon: Video },
    { to: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/dashboard/rag', label: 'RAG Library', icon: BookOpen },
  ];

  return (
    <aside className="w-64 glass-effect border-r border-gray-800 flex flex-col justify-between h-screen sticky top-0">
      <div className="flex flex-col flex-1">
        {/* Header Logo */}
        <div className="p-6 border-b border-gray-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
            Co
          </div>
          <div>
            <h1 className="text-md font-extrabold tracking-wider bg-gradient-to-r from-white via-gray-200 to-purple-400 bg-clip-text text-transparent">
              INTERVIEW
            </h1>
            <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-widest -mt-1">
              Copilot AI
            </p>
          </div>
        </div>

        {/* Gamification Streak & Level HUD */}
        <div className="mx-4 my-4 p-3 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500/30" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold">Streak</p>
              <p className="text-xs font-bold text-orange-400">{user.streak} Days</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 border-l border-gray-800 pl-3">
            <Award className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold">Level</p>
              <p className="text-xs font-bold text-purple-300">Lvl {user.level}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5 py-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border-l-4 border-purple-500 pl-3'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}

          {/* Admin link */}
          {user.role === 'admin' && (
            <NavLink
              to="/dashboard/admin"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-red-950/30 text-red-400 border-l-4 border-red-500 pl-3'
                    : 'text-gray-400 hover:text-red-400 hover:bg-red-950/10'
                }`
              }
            >
              <Shield className="w-4 h-4" />
              <span>Admin Center</span>
            </NavLink>
          )}
        </nav>
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-gray-800 bg-gray-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold uppercase ring-2 ring-purple-500/20">
              {user.full_name.substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate max-w-[120px]">{user.full_name}</h4>
              <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            title="Log Out"
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800/40 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 bg-gray-900 rounded-full h-1.5 overflow-hidden">
          {/* Level Progress Bar: 500 XP per level */}
          <div 
            className="bg-purple-500 h-full rounded-full" 
            style={{ width: `${((user.xp % 500) / 500) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[8px] text-gray-500 mt-1">
          <span>XP: {user.xp % 500} / 500</span>
          <span>Total: {user.xp} XP</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
