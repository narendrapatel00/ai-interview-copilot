import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Terminal, 
  Mic, 
  FileCheck, 
  ShieldCheck, 
  ChevronRight, 
  Zap 
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const { user } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: any = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-200 overflow-x-hidden">
      {/* Header NavBar */}
      <header className="border-b border-gray-900 bg-[#070a13]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
              Co
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              INTERVIEW<span className="text-purple-500">.AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Success Stories</a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/25 transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/25 transition-all flex items-center space-x-1"
                >
                  <span>Get Started</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-3xl flex flex-col items-center"
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-400 text-xs font-semibold mb-6 shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing Real-time AI Coding & Voice Rounds</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-none"
          >
            Land Your Dream Job with <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
              AI Interview Copilot
            </span>
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="mt-6 text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl"
          >
            Upload your resume, select your target role, and face immersive coding, behavioral, and system design interviews. Receive instant feedback, scores, and custom learning roadmaps.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 w-full"
          >
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20 hover:scale-102 hover:shadow-purple-500/35 active:scale-98 transition-all flex items-center justify-center space-x-2"
            >
              <span>Get Started For Free</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a 
              href="#demo" 
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Features</span>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-20 bg-gray-950/40 border-y border-gray-900 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white">Full-Stack Simulation Features</h2>
            <p className="text-gray-400 text-sm mt-3">
              We cover all phases of modern interview selection to prepare you fully for MAANG and top-tier startups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Resume Optimizer */}
            <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 hover:border-purple-500/30 transition-all flex flex-col space-y-4 shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">ATS Optimizer</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Scan your resume PDF, obtain scoring sheets, isolate missing skills, and instantly rewrite summaries/projects using target STAR formatting.
              </p>
            </div>

            {/* Feature 2: Monaco Coding */}
            <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 hover:border-purple-500/30 transition-all flex flex-col space-y-4 shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-indigo-950/50 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Monaco Code Console</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Face LeetCode-style assessments directly in Python, JS, and Java using an integrated Monaco Editor. Run code templates, set timers, and analyze logic.
              </p>
            </div>

            {/* Feature 3: Voice transcription */}
            <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80 hover:border-purple-500/30 transition-all flex flex-col space-y-4 shadow-sm group">
              <div className="w-12 h-12 rounded-xl bg-pink-950/50 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:bg-pink-600 group-hover:text-white transition-all duration-300">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Voice & Whisper Audio</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Speak directly into the microphone. Whisper transcribes details in real-time, feeding transcripts into the LLM system to test speech fluency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white">Land Job Offers Worldwide</h2>
          <p className="text-gray-400 text-sm mt-3">See how developers are using our AI simulator to refine their interview communication skills.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-gray-950/60 border border-gray-900 flex flex-col justify-between">
            <p className="text-gray-300 text-sm leading-relaxed italic">
              "The STAR framework evaluation on behavioral answers was a game-changer. It showed me exactly where I wasn't being quantitative enough about my results."
            </p>
            <div className="flex items-center space-x-3 mt-6">
              <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white text-xs">
                AK
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Abhishek K.</h4>
                <p className="text-[10px] text-purple-400">Software Engineer @ Microsoft</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gray-950/60 border border-gray-900 flex flex-col justify-between">
            <p className="text-gray-300 text-sm leading-relaxed italic">
              "Running coding rounds under a live timer in Monaco editor simulated the pressure of real tests. The AI code review pointed out spatial complexity issues I missed."
            </p>
            <div className="flex items-center space-x-3 mt-6">
              <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white text-xs">
                LN
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Lina N.</h4>
                <p className="text-[10px] text-indigo-400">AI Specialist @ OpenAI Partner</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gray-950/60 border border-gray-900 flex flex-col justify-between">
            <p className="text-gray-300 text-sm leading-relaxed italic">
              "The resume missing-skills report is super accurate. I modified my project descriptions based on its STAR rewrite recommendations, and response rates doubled."
            </p>
            <div className="flex items-center space-x-3 mt-6">
              <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center font-bold text-white text-xs">
                RT
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Ryan T.</h4>
                <p className="text-[10px] text-pink-400">Full-Stack Lead @ Stripe</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section id="pricing" className="py-20 bg-gray-950/40 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white">Flexible Pricing Plans</h2>
            <p className="text-gray-400 text-sm mt-3">Invest in your career prep. Start free, upgrade when you need intensive coaching.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free plan */}
            <div className="p-8 rounded-2xl bg-gray-900/30 border border-gray-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <p className="text-gray-500 text-xs mt-1">Get to know the copilot</p>
                <div className="my-6">
                  <span className="text-3xl font-extrabold text-white">$0</span>
                  <span className="text-gray-500 text-xs">/ forever</span>
                </div>
                <ul className="space-y-3 text-xs text-gray-400 border-t border-gray-800/80 pt-6">
                  <li className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>1 PDF Resume Scan & ATS Score</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>2 Completed AI Mock Interviews</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>Standard text feedback</span>
                  </li>
                </ul>
              </div>
              <Link 
                to="/register" 
                className="mt-8 block text-center py-2.5 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                Sign Up Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-2xl bg-gradient-to-b from-gray-900 to-purple-950/20 border-2 border-purple-500/50 flex flex-col justify-between relative shadow-xl shadow-purple-500/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-[10px] font-extrabold text-white uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pro Coach</h3>
                <p className="text-purple-400 text-xs mt-1">For serious job seekers</p>
                <div className="my-6">
                  <span className="text-3xl font-extrabold text-white">$19</span>
                  <span className="text-gray-400 text-xs">/ month</span>
                </div>
                <ul className="space-y-3 text-xs text-gray-300 border-t border-purple-500/20 pt-6">
                  <li className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-white">Unlimited ATS Resume Scans</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Unlimited Mock Interviews</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Monaco Editor & Code Evaluation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Voice rounds (Whisper) & STAR analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>PDF Detailed report download</span>
                  </li>
                </ul>
              </div>
              <Link 
                to="/register" 
                className="mt-8 block text-center py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/25 transition-all"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Custom plan */}
            <div className="p-8 rounded-2xl bg-gray-900/30 border border-gray-800 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Enterprise</h3>
                <p className="text-gray-500 text-xs mt-1">For universities & bootcamps</p>
                <div className="my-6">
                  <span className="text-3xl font-extrabold text-white">Custom</span>
                  <span className="text-gray-500 text-xs">/ contracts</span>
                </div>
                <ul className="space-y-3 text-xs text-gray-400 border-t border-gray-800/80 pt-6">
                  <li className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>Cohort progress analytics dashboard</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>Custom question pools & admin panels</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>Dedicated vector DB for school guides</span>
                  </li>
                </ul>
              </div>
              <a 
                href="mailto:partners@interviewcopilot.ai" 
                className="mt-8 block text-center py-2.5 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-12 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3 mb-6 md:mb-0">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-sm">
            Co
          </div>
          <span className="text-white font-semibold">INTERVIEW.AI</span>
        </div>
        <div className="flex space-x-8 mb-6 md:mb-0">
          <a href="#features" className="hover:underline">About</a>
          <a href="#pricing" className="hover:underline">Privacy</a>
          <a href="#pricing" className="hover:underline">Terms</a>
          <a href="mailto:support@interviewcopilot.ai" className="hover:underline">Contact</a>
        </div>
        <p>© 2026 AI Interview Copilot. Built with React + FastAPI.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
