import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { LiveEvaluator } from './components/LiveEvaluator';
import { RiskAgentView } from './components/RiskAgentView';
import { AuthenticityAgentView } from './components/AuthenticityAgentView';
import { ReviewAgentView } from './components/ReviewAgentView';
import { DecisionEngineAuditView } from './components/DecisionEngineAuditView';
import { DatasetBenchmarksView } from './components/DatasetBenchmarksView';
import { EmailAlertsManager } from './components/EmailAlertsManager';
import { AmazonProductSearch } from './components/AmazonProductSearch';
import { AuthModal } from './components/AuthModal';

const MainLayout: React.FC = () => {
  const { activeTab } = useAuth();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 10000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {showIntro && (
        <div className="app-intro-overlay">
          <div className="app-intro-card">
            <div className="intro-grid-overlay" />
            <div className="intro-ambient ambient-a" />
            <div className="intro-ambient ambient-b" />
            <div className="intro-ambient ambient-c" />
            <div className="scene-3d intro-scene">
              <div className="orb-3d intro-orb" />
              <div className="intro-sheen" />
              <div className="trustshield-logo-wrapper">
                <div className="trustshield-ring" />
                <div className="trustshield-badge">
                  <div className="trustshield-shield">
                    <span>TS</span>
                  </div>
                </div>
              </div>
              <div className="panel-3d panel-a intro-panel-a" />
              <div className="panel-3d panel-b intro-panel-b" />
              <div className="panel-3d panel-c intro-panel-c" />
            </div>
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-blue-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                TrustShield AI
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                A new standard in intelligent trust
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                Orchestrating fraud defense, authenticity verification, and review intelligence in one elegant operating layer.
              </p>
              <div className="intro-progress mt-5">
                <span />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Top Header */}
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Navigation Sidebar */}
        <Sidebar />

        {/* Main Content Body */}
        <main className="flex-1 p-6 overflow-x-hidden min-w-0">
          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'evaluator' && <LiveEvaluator />}
          {activeTab === 'amazon_search' && <AmazonProductSearch />}
          {activeTab === 'risk_agent' && <RiskAgentView />}
          {activeTab === 'auth_agent' && <AuthenticityAgentView />}
          {activeTab === 'review_agent' && <ReviewAgentView />}
          {activeTab === 'decision_engine' && <DecisionEngineAuditView />}
          {activeTab === 'email_alerts' && <EmailAlertsManager />}
          {activeTab === 'dataset_benchmarks' && <DatasetBenchmarksView />}
        </main>
      </div>

      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
