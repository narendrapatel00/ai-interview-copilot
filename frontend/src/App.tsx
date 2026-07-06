import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardHome from './pages/DashboardHome';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoom from './pages/InterviewRoom';
import ReportView from './pages/ReportView';
import LeaderboardPage from './pages/LeaderboardPage';
import RagLibrary from './pages/RagLibrary';
import AdminDashboard from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Dashboard Views */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="resume" element={<ResumeAnalyzer />} />
            <Route path="interview/setup" element={<InterviewSetup />} />
            <Route path="interview/:id" element={<InterviewRoom />} />
            <Route path="report/:id" element={<ReportView />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="rag" element={<RagLibrary />} />
            <Route path="admin" element={<AdminDashboard />} />
            {/* Fallback inside dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
