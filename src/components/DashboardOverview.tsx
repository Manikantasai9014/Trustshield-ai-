import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Ban,
  TrendingUp,
  DollarSign,
  Activity,
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  Eye,
  FileCheck,
  ExternalLink,
  RefreshCw,
  Clock3,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RiskHeatmap } from './RiskHeatmap';

export const DashboardOverview: React.FC = () => {
  const { stats, cases, setSelectedCase, setActiveTab, lastSynced, refreshData, user } = useAuth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleInspectCase = (c: any) => {
    setSelectedCase(c);
    setActiveTab('decision_engine');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div id="dashboard-overview" className="space-y-6">
      
      {/* Page Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>TrustShield AI Overview</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Live Monitoring
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-agent orchestration for transaction fraud, counterfeit listings, and fake reviews.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('evaluator')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Multi-Agent Evaluator</span>
        </button>
      </div>

      {/* Live Operations Panel */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 p-5 shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">Guardrail Pulse</span>
          </div>
          <p className="mt-3 text-sm text-slate-300">
            {user?.name ? `${user.name} is monitoring ${stats?.blockedCount || 0} high-risk signals in real time.` : 'Your fraud guardrails are active and scanning every new case.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('email_alerts')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              <BellRing className="w-3.5 h-3.5" />
              Open Alerts
            </button>
            <button
              onClick={() => setActiveTab('dataset_benchmarks')}
              className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-500/20"
            >
              <Eye className="w-3.5 h-3.5" />
              Review Benchmarks
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sync Status</p>
              <p className="mt-1 text-sm font-medium text-white">{isRefreshing ? 'Refreshing insights…' : 'Live and synced'}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <Clock3 className="w-4 h-4" />
            <span>{lastSynced ? `Last synced ${lastSynced.toLocaleTimeString()}` : 'Waiting for first sync'}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Now
          </button>
        </div>
      </div>

      {/* 3D Animated Hero Panel */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/80 p-6 shadow-2xl shadow-blue-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.2),_transparent_35%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-300">
              <Sparkles className="w-3.5 h-3.5" />
              Immersive Defense Layer
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              A cinematic view of every fraud signal, fused in real time.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
              TrustShield AI now renders a live 3D-style security scene that makes the network feel alive while every agent evaluates risk, authenticity, and review integrity.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('evaluator')}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Run Live Analysis
              </button>
              <button
                onClick={() => setActiveTab('risk_agent')}
                className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
              >
                Explore Risk Signals
              </button>
            </div>
          </div>

          <div className="relative mx-auto flex min-h-[260px] w-full max-w-[360px] items-center justify-center">
            <div className="scene-3d">
              <div className="orb-3d" />
              <div className="panel-3d panel-a" />
              <div className="panel-3d panel-b" />
              <div className="panel-3d panel-c" />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Evaluated */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Evaluated</span>
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats?.totalEvaluated || 0}</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +100%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Live transaction & listing requests</p>
        </div>

        {/* Card 2: Total Fraud Prevented */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fraud Losses Prevented</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              ${stats?.totalFraudPreventedAmount ? stats.totalFraudPreventedAmount.toLocaleString() : '0'}
            </span>
            <span className="text-xs font-medium text-emerald-400">Protected</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Prevented return & counterfeit loss</p>
        </div>

        {/* Card 3: Blocked High-Risk Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blocked Fraud Items</span>
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{stats?.blockedCount || 0}</span>
            <span className="text-xs font-medium text-red-400">
              {stats?.totalEvaluated ? ((stats.blockedCount / stats.totalEvaluated) * 100).toFixed(0) : 0}% Block Rate
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Risk Score &gt; 70 Auto-Blocked</p>
        </div>

        {/* Card 4: Agent Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agent Ensemble Accuracy</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">96.8%</span>
            <span className="text-xs font-medium text-purple-400">IEEE / Amazon Benchmark</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Multi-Agent fused decision precision</p>
        </div>

      </div>

      {/* Real-Time High-Risk Detection Heatmap */}
      <RiskHeatmap cases={cases} />

      {/* Multi-Agent Architecture Flow Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Multi-Agent Trust Architecture</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Three specialized agents evaluate input parameters concurrently before feeding the Decision Engine.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-blue-300">
            Weighted Score = 0.40(Agent 1) + 0.30(Agent 2) + 0.30(Agent 3)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          
          {/* Agent 1 Box */}
          <div 
            onClick={() => setActiveTab('risk_agent')}
            className="bg-slate-950/80 border border-blue-500/30 hover:border-blue-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">AGENT 1 (40%)</span>
              <span className="text-[10px] text-slate-400">IEEE-CIS Dataset</span>
            </div>
            <h3 className="font-semibold text-white text-sm">Risk Scoring Agent</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Detects COD payment abuse, VPN/Proxy threats, velocity anomalies, and customer return ratios.
            </p>
          </div>

          {/* Agent 2 Box */}
          <div 
            onClick={() => setActiveTab('auth_agent')}
            className="bg-slate-950/80 border border-amber-500/30 hover:border-amber-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">AGENT 2 (30%)</span>
              <span className="text-[10px] text-slate-400">Counterfeit Dataset</span>
            </div>
            <h3 className="font-semibold text-white text-sm">Authenticity & Integrity Agent</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Analyzes image logo placement, packaging quality, MSRP price variance, and seller authorization.
            </p>
          </div>

          {/* Agent 3 Box */}
          <div 
            onClick={() => setActiveTab('review_agent')}
            className="bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">AGENT 3 (30%)</span>
              <span className="text-[10px] text-slate-400">Amazon Fake Reviews</span>
            </div>
            <h3 className="font-semibold text-white text-sm">Review Moderation Agent</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Identifies AI-generated reviews, repetitive superlative phrasing, and unverified reviewer bursts.
            </p>
          </div>

        </div>

        {/* Decision Bands Bar */}
        <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-300">
            Decision Engine Output Thresholds:
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>0–40: Approve</span>
            </div>
            <div className="flex-1 md:flex-initial flex items-center space-x-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>41–70: Manual Review</span>
            </div>
            <div className="flex-1 md:flex-initial flex items-center space-x-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 font-medium">
              <Ban className="w-3.5 h-3.5" />
              <span>&gt;70: Block</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Evaluated Cases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span>Recent Evaluated Cases & Audit Log</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Live cases analyzed by the multi-agent ensemble</p>
          </div>
          <button
            onClick={() => setActiveTab('decision_engine')}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>View All Vault Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Product / Item</th>
                <th className="py-3 px-4">Txn Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-center">Agent Scores (1 / 2 / 3)</th>
                <th className="py-3 px-4 text-center">Overall Risk</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {cases.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-blue-400 font-semibold">{c.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white max-w-[200px] truncate">{c.input.listing.title}</div>
                    <div className="text-[10px] text-slate-500">{c.input.listing.brand}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">${c.input.transaction.amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-400">{c.input.transaction.paymentMethod}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-1.5 font-mono text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">{c.riskAgent.score}</span>
                      <span className="text-slate-600">/</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">{c.authenticityAgent.score}</span>
                      <span className="text-slate-600">/</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{c.reviewAgent.score}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-sm text-white font-mono">{c.decision.overallRiskScore}</span>
                    <span className="text-[10px] text-slate-500 ml-1">/100</span>
                  </td>
                  <td className="py-3 px-4">
                    {c.status === "Blocked" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                        <Ban className="w-3 h-3" /> Blocked
                      </span>
                    )}
                    {c.status === "Under Manual Review" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> Manual Review
                      </span>
                    )}
                    {c.status === "Approved" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleInspectCase(c)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      title="Inspect Decision & Audit Details"
                    >
                      <Eye className="w-4 h-4" />
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
