import React from 'react';
import { ShieldCheck, Cpu, User, LogIn, Play, RefreshCw, Zap, Bell, Sun, Moon, ShoppingBag } from 'lucide-react';
import { useAuth, NavTab } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AgentHealthMonitor } from './AgentHealthMonitor';

export const Navbar: React.FC = () => {

  const { user, activeTab, setActiveTab, setIsAuthModalOpen, refreshData } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'trust_lead': return 'Trust & Safety Lead';
      case 'fraud_analyst': return 'Fraud Operations Analyst';
      case 'merchant_reviewer': return 'Brand Authenticity Inspector';
      default: return 'Trust Analyst';
    }
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div id="header-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div id="brand-container" className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div id="brand-logo" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div id="brand-title" className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">TrustShield</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">AI Multi-Agent</span>
            </div>
            <p id="brand-subtitle" className="text-xs text-slate-400 hidden sm:block">Real-Time Fraud, Counterfeit & Fake Review Defense Platform</p>
          </div>
        </div>

        {/* Live Engine Status & Actions */}
        <div id="header-actions" className="flex items-center space-x-3">
          
          {/* Real-Time Agent Health & Connectivity Monitor */}
          <AgentHealthMonitor />

          {/* Amazon Product Search Trigger */}
          <button
            id="nav-amazon-search-btn"
            onClick={() => setActiveTab('amazon_search')}
            title="Search Amazon Products directly on site"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'amazon_search'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Amazon Product Search</span>
          </button>

          {/* Quick Evaluator Trigger */}

          <button
            id="run-evaluator-btn"
            onClick={() => setActiveTab('evaluator')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'evaluator'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Live Evaluator</span>
          </button>

          {/* Email Alerts Shortcut */}
          <button
            id="nav-email-alerts-btn"
            onClick={() => setActiveTab('email_alerts')}
            title="Email Alerts & Threshold Configuration"
            className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
              activeTab === 'email_alerts'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Refresh Data */}
          <button
            id="refresh-data-btn"
            onClick={() => refreshData()}
            title="Refresh System Analytics"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Theme Toggle (Dark / Light Mode) */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'Light Theme' : 'Dark Mode'}`}
            className="p-2 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-slate-700/60"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* User Profile Badge */}
          <button
            id="user-profile-btn"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-1.5 transition-colors text-left"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-400" />
            ) : (
              <User className="w-4 h-4 text-slate-300" />
            )}
            <div className="hidden lg:block">
              <div className="text-xs font-medium text-white">{user?.name || 'Guest User'}</div>
              <div className="text-[10px] text-emerald-400 font-mono">{getRoleLabel(user?.role)}</div>
            </div>
          </button>

        </div>

      </div>
    </header>
  );
};
