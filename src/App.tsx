import React from 'react';
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
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
