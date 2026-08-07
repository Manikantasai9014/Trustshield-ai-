import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  MessageSquare, 
  Activity, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ChevronDown,
  Info
} from 'lucide-react';
import { fetchAgentHealth, pingAgentHealth, toggleAgentSimulation } from '../services/api';
import { SystemHealthOverview, AgentHealthInfo } from '../types';

export const AgentHealthMonitor: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthOverview | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const loadHealth = async () => {
    try {
      const data = await fetchAgentHealth();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch agent health status:', err);
    }
  };

  useEffect(() => {
    loadHealth();
    // Auto refresh health ping every 12 seconds
    const interval = setInterval(() => {
      loadHealth();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePingAll = async () => {
    setIsRefreshing(true);
    try {
      const res = await pingAgentHealth();
      setHealthData(res);
      setActionMessage('Pings sent! All agent response times refreshed.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage('Error sending live health pings.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleSimulation = async (agentId: string) => {
    try {
      const res = await toggleAgentSimulation(agentId);
      setActionMessage(res.message);
      loadHealth();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Simulation toggle failed:', err);
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'offline') => {
    switch (status) {
      case 'healthy': return {
        dot: 'bg-emerald-500',
        ping: 'bg-emerald-400',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        label: 'Operational'
      };
      case 'degraded': return {
        dot: 'bg-amber-500',
        ping: 'bg-amber-400',
        text: 'text-amber-400',
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        label: 'High Latency'
      };
      case 'offline': return {
        dot: 'bg-red-500',
        ping: 'bg-red-400',
        text: 'text-red-400',
        badge: 'bg-red-500/10 text-red-400 border-red-500/30',
        label: 'Offline'
      };
    }
  };

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'risk': return <ShieldAlert className="w-4 h-4 text-blue-400" />;
      case 'authenticity': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'review': return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const operationalCount = healthData?.agents.filter(a => a.status === 'healthy').length || 0;
  const totalAgents = healthData?.agents.length || 3;

  return (
    <div id="agent-health-monitor-wrapper" className="relative" ref={dropdownRef}>
      {/* Compact Navbar Status Badge Button */}
      <button
        id="agent-health-monitor-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="View Real-Time Multi-Agent Health & Latency"
        className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          isOpen
            ? 'bg-slate-800 text-white border-blue-500/50 shadow-lg shadow-blue-500/10'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/60'
        }`}
      >
        <div className="flex items-center space-x-1">
          <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="font-semibold text-slate-200 hidden xl:inline">AI Agents:</span>
        </div>

        {/* Real-time Color Coded Indicator Dots */}
        <div className="flex items-center space-x-1.5 px-1 py-0.5 rounded bg-slate-950/50 border border-slate-800">
          {healthData ? (
            healthData.agents.map((agent) => {
              const style = getStatusColor(agent.status);
              return (
                <div key={agent.id} className="relative flex items-center justify-center group" title={`${agent.name}: ${style.label} (${agent.latencyMs}ms)`}>
                  <span className={`relative flex h-2.5 w-2.5`}>
                    {agent.status === 'healthy' && (
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.ping} opacity-75`}></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${style.dot}`}></span>
                  </span>
                </div>
              );
            })
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-600 animate-pulse"></span>
              <span className="h-2 w-2 rounded-full bg-slate-600 animate-pulse"></span>
              <span className="h-2 w-2 rounded-full bg-slate-600 animate-pulse"></span>
            </>
          )}
        </div>

        <span className="font-mono text-[11px] text-slate-300 hidden md:inline">
          {operationalCount}/{totalAgents} Active
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Health Monitoring Popover Dropdown */}
      {isOpen && (
        <div 
          id="agent-health-dropdown"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-4 space-y-4 animate-fade-in text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide uppercase">Agent Health & Connectivity</h4>
                <p className="text-[10px] text-slate-400">Real-Time Multi-Agent Cluster Telemetry</p>
              </div>
            </div>

            <button
              id="ping-all-agents-btn"
              onClick={handlePingAll}
              disabled={isRefreshing}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Ping All</span>
            </button>
          </div>

          {/* Alert Message Banner */}
          {actionMessage && (
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center space-x-2 animate-fade-in">
              <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Overall Mesh Summary Status */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {operationalCount === totalAgents ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
              )}
              <div>
                <div className="text-xs font-semibold text-white">
                  {operationalCount === totalAgents ? 'Multi-Agent Mesh Fully Operational' : `${totalAgents - operationalCount} Agent Degradation Detected`}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Weighted: 40% Risk + 30% Auth + 30% Review
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
              42ms avg
            </span>
          </div>

          {/* Individual Agent Telemetry Cards */}
          <div className="space-y-2.5">
            {healthData?.agents.map((agent) => {
              const statusStyle = getStatusColor(agent.status);
              return (
                <div 
                  key={agent.id}
                  className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 bg-slate-900 rounded-md border border-slate-800">
                        {getAgentIcon(agent.id)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>{agent.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({agent.weight})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{agent.model}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusStyle.badge} flex items-center space-x-1`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                        <span>{statusStyle.label}</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {agent.status === 'offline' ? '0 ms' : `${agent.latencyMs} ms`}
                      </span>
                    </div>
                  </div>

                  {/* Latency & Metrics Bar */}
                  <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center space-x-3">
                      <span>Uptime: <strong className="text-slate-200 font-mono">{agent.uptimePercent}%</strong></span>
                      <span>Active Req: <strong className="text-slate-200 font-mono">{agent.activeRequests}</strong></span>
                    </div>

                    {/* Simulation Toggle Button */}
                    <button
                      onClick={() => handleToggleSimulation(agent.id)}
                      title="Click to cycle status between Operational, High Latency, and Offline for testing"
                      className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                    >
                      Cycle Status
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center space-x-1">
              <Info className="w-3 h-3 text-slate-400" />
              <span>Auto-polled every 12s</span>
            </div>
            <span>Last checked: {healthData ? new Date(healthData.lastChecked).toLocaleTimeString() : 'Just now'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
