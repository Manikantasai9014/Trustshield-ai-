import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Zap,
  CreditCard,
  ShieldAlert,
  MessageSquare,
  Scale,
  Database,
  ChevronRight,
  ShieldCheck,
  Layers,
  Bell,
  RefreshCw,
  CheckCircle2,
  Cloud,
  ShoppingBag
} from 'lucide-react';
import { useAuth, NavTab } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, stats, lastSynced, refreshData } = useAuth();
  const [relativeTime, setRelativeTime] = useState<string>('Just now');
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  // Periodically update the relative time indicator
  useEffect(() => {
    const updateRelativeTime = () => {
      if (!lastSynced) {
        setRelativeTime('Syncing...');
        return;
      }
      const now = new Date();
      const diffSec = Math.max(0, Math.floor((now.getTime() - lastSynced.getTime()) / 1000));

      if (diffSec < 5) {
        setRelativeTime('Just now');
      } else if (diffSec < 60) {
        setRelativeTime(`${diffSec}s ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) {
          setRelativeTime(`${diffMin}m ago`);
        } else {
          const diffHour = Math.floor(diffMin / 60);
          setRelativeTime(`${diffHour}h ago`);
        }
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 3000);
    return () => clearInterval(interval);
  }, [lastSynced]);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await refreshData();
    setTimeout(() => setIsManualSyncing(false), 400);
  };

  const navItems = [
    {
      group: "OVERVIEW",
      items: [
        { id: 'dashboard' as NavTab, label: 'Executive Dashboard', icon: LayoutDashboard, badge: null }
      ]
    },
    {
      group: "MULTI-AGENT WORKSPACE",
      items: [
        { id: 'evaluator' as NavTab, label: 'Live Multi-Agent Runner', icon: Zap, badge: 'Interactive' },
        { id: 'amazon_search' as NavTab, label: 'Amazon Product Search', icon: ShoppingBag, badge: 'In-Site' }
      ]
    },
    {
      group: "SPECIALIZED AI AGENTS",
      items: [
        { id: 'risk_agent' as NavTab, label: 'Agent 1: Risk & COD Fraud', icon: CreditCard, badge: 'IEEE-CIS' },
        { id: 'auth_agent' as NavTab, label: 'Agent 2: Authenticity & Logo', icon: ShieldAlert, badge: 'Vision' },
        { id: 'review_agent' as NavTab, label: 'Agent 3: Review Moderation', icon: MessageSquare, badge: 'OpSpam' }
      ]
    },
    {
      group: "GOVERNANCE & AUDIT",
      items: [
        { id: 'decision_engine' as NavTab, label: 'Decision Engine & Audit Vault', icon: Scale, badge: stats ? `${stats.totalEvaluated}` : undefined },
        { id: 'email_alerts' as NavTab, label: 'Email Alerts & Thresholds', icon: Bell, badge: 'Alerts' },
        { id: 'dataset_benchmarks' as NavTab, label: 'Benchmark Datasets', icon: Database, badge: '3 Datasets' }
      ]
    }
  ];

  return (
    <aside id="sidebar-navigation" className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {navItems.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {group.group}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                        isActive ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer Controls */}
      <div className="p-3 m-3 space-y-3">
        {/* Decision Engine Formula Footer Badge */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-400 font-semibold">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Decision Weight Formula</span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800/60 leading-relaxed">
            <div className="text-blue-400 font-bold">40% Risk Agent</div>
            <div className="text-amber-400 font-bold">+ 30% Authenticity</div>
            <div className="text-emerald-400 font-bold">+ 30% Review Agent</div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between pt-1">
            <span>0-40: Approve</span>
            <span>41-70: Review</span>
            <span>&gt;70: Block</span>
          </div>
        </div>

        {/* Subtle Last Synced Status Indicator */}
        <div 
          id="sidebar-last-synced-indicator"
          className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs transition-all hover:border-slate-700/80"
          title={lastSynced ? `Data last fetched at ${lastSynced.toLocaleTimeString()} (${lastSynced.toLocaleDateString()})` : 'Fetching initial backend data...'}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Backend Status</span>
              <div className="flex items-center space-x-1 text-slate-300 text-[11px] font-medium truncate">
                <span>Synced</span>
                <span className="font-mono text-emerald-400 font-bold">• {relativeTime}</span>
              </div>
            </div>
          </div>

          <button
            id="sidebar-sync-now-btn"
            onClick={handleManualSync}
            disabled={isManualSyncing}
            title="Force refresh backend data"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isManualSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </aside>
  );
};
