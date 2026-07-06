import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Users, FileText, Video, Award, Trash2, AlertCircle } from 'lucide-react';

interface SystemStats {
  total_users: number;
  total_resumes: number;
  total_sessions: number;
  completed_sessions: number;
  global_average_score: number;
  role_distribution: Array<{ role: string; count: number }>;
}

interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  xp: number;
  level: number;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/system-analytics'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unauthorized: Only administrators are permitted to view this panel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete user account: ${email}? This action is irreversible.`)) {
      return;
    }

    try {
      await api.delete(`/admin/user/${userId}`);
      setSuccess(`Successfully deleted user: ${email}`);
      // Refresh
      fetchAdminData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-900 rounded-2xl border border-gray-850" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-400 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <h3 className="text-sm font-bold text-white font-mono">Administrative Sync Fail</h3>
        <p className="text-xs text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-red-500" />
          <span>System Administration Center</span>
        </h1>
        <p className="text-sm text-gray-400">
          Monitor global platform signups, inspect database metrics, and manage user accounts.
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-500/25 text-purple-300 text-xs flex items-center space-x-2">
          <CheckCircleIcon className="w-4 h-4 text-purple-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Stats Cards Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-850/80 shadow-md">
            <div className="flex items-center justify-between mb-3 text-purple-400">
              <Users className="w-5 h-5" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Users</span>
            </div>
            <h3 className="text-2xl font-black text-white">{stats.total_users}</h3>
            <p className="text-xs text-gray-400 mt-1">Total registered accounts</p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-850/80 shadow-md">
            <div className="flex items-center justify-between mb-3 text-indigo-400">
              <FileText className="w-5 h-5" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Resumes</span>
            </div>
            <h3 className="text-2xl font-black text-white">{stats.total_resumes}</h3>
            <p className="text-xs text-gray-400 mt-1">Total PDF uploads parsed</p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-850/80 shadow-md">
            <div className="flex items-center justify-between mb-3 text-pink-400">
              <Video className="w-5 h-5" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Interviews</span>
            </div>
            <h3 className="text-2xl font-black text-white">{stats.total_sessions}</h3>
            <p className="text-xs text-gray-400 mt-1">Completed mock rounds: {stats.completed_sessions}</p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/40 border border-gray-850/80 shadow-md">
            <div className="flex items-center justify-between mb-3 text-emerald-400">
              <Award className="w-5 h-5" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500">Quality</span>
            </div>
            <h3 className="text-2xl font-black text-white">{stats.global_average_score}%</h3>
            <p className="text-xs text-gray-400 mt-1">Global performance rating</p>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="glass-effect rounded-2xl border border-gray-850/80 overflow-hidden shadow-md">
        <div className="p-4 border-b border-gray-800 bg-gray-950/20">
          <h3 className="text-xs font-bold text-white">Registered Candidate Profiles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950/40 border-b border-gray-850 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                <th className="p-4">User Details</th>
                <th className="p-4">Authorization</th>
                <th className="p-4 text-center">Milestones</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Account Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850 text-xs text-gray-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/10">
                  <td className="p-4 flex flex-col">
                    <span className="font-bold text-white">{u.full_name}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">{u.email}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'admin' 
                        ? 'bg-red-950 border border-red-500/20 text-red-400' 
                        : 'bg-gray-950 border border-gray-800 text-gray-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="font-semibold text-purple-400">Lvl {u.level}</span>
                    <span className="text-[10px] text-gray-500 ml-1">({u.xp} XP)</span>
                  </td>
                  <td className="p-4">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      className="p-1.5 hover:bg-red-950/40 text-gray-500 hover:text-red-450 border border-transparent hover:border-red-500/20 rounded-lg transition-colors cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple icon wrapper
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AdminDashboard;
