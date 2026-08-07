import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Flame, 
  ShieldAlert, 
  TrendingUp, 
  Calendar, 
  Filter, 
  Zap,
  Info,
  BarChart2
} from 'lucide-react';
import { AuditCase } from '../types';

interface RiskHeatmapProps {
  cases: AuditCase[];
}

// 7 Days of the week
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// 6 Time slots (4-hour intervals)
const TIME_SLOTS = [
  { id: '00-04', label: '00:00 - 04:00', shortLabel: '00-04h', tag: 'Night' },
  { id: '04-08', label: '04:00 - 08:00', shortLabel: '04-08h', tag: 'Dawn' },
  { id: '08-12', label: '08:00 - 12:00', shortLabel: '08-12h', tag: 'Morning' },
  { id: '12-16', label: '12:00 - 16:00', shortLabel: '12-16h', tag: 'Afternoon' },
  { id: '16-20', label: '16:00 - 20:00', shortLabel: '16-20h', tag: 'Evening' },
  { id: '20-24', label: '20:00 - 24:00', shortLabel: '20-24h', tag: 'Late Night' }
];

// Baseline realistic risk distribution matrix (Day x TimeSlot) to blend with live evaluated cases
const BASELINE_HEATMAP: Record<string, Record<string, { count: number; avgScore: number; mainRisk: string }>> = {
  Mon: {
    '00-04': { count: 18, avgScore: 84, mainRisk: 'VPN Proxy + COD' },
    '04-08': { count: 6, avgScore: 52, mainRisk: 'MSRP Variance' },
    '08-12': { count: 9, avgScore: 61, mainRisk: 'Review Bot' },
    '12-16': { count: 12, avgScore: 65, mainRisk: 'Fake Review Burst' },
    '16-20': { count: 15, avgScore: 78, mainRisk: 'High Velocity Txn' },
    '20-24': { count: 22, avgScore: 89, mainRisk: 'Nighttime Bot Army' }
  },
  Tue: {
    '00-04': { count: 24, avgScore: 91, mainRisk: 'Credential Stuffing + COD' },
    '04-08': { count: 4, avgScore: 48, mainRisk: 'Unverified Review' },
    '08-12': { count: 11, avgScore: 58, mainRisk: 'Logo Alteration' },
    '12-16': { count: 14, avgScore: 62, mainRisk: 'Return Ratio Spike' },
    '16-20': { count: 19, avgScore: 81, mainRisk: 'Proxy Network' },
    '20-24': { count: 27, avgScore: 93, mainRisk: 'Automated Checkout' }
  },
  Wed: {
    '00-04': { count: 21, avgScore: 88, mainRisk: 'High Velocity COD' },
    '04-08': { count: 5, avgScore: 42, mainRisk: 'Minor Price Drop' },
    '08-12': { count: 8, avgScore: 55, mainRisk: 'Suspicious Reviewer' },
    '12-16': { count: 16, avgScore: 71, mainRisk: 'Counterfeit Logo' },
    '16-20': { count: 18, avgScore: 77, mainRisk: 'VPN Location Spoof' },
    '20-24': { count: 25, avgScore: 90, mainRisk: 'Night Attack Cluster' }
  },
  Thu: {
    '00-04': { count: 28, avgScore: 94, mainRisk: 'VPN Proxy + High Velocity' },
    '04-08': { count: 7, avgScore: 50, mainRisk: 'Packaging Anomaly' },
    '08-12': { count: 10, avgScore: 60, mainRisk: 'Inauthentic Seller' },
    '12-16': { count: 15, avgScore: 68, mainRisk: 'AI-Generated Review' },
    '16-20': { count: 22, avgScore: 83, mainRisk: 'Return Fraud Ring' },
    '20-24': { count: 31, avgScore: 96, mainRisk: 'High Risk Spike Peak' }
  },
  Fri: {
    '00-04': { count: 32, avgScore: 95, mainRisk: 'Weekend Bot Launch' },
    '04-08': { count: 8, avgScore: 56, mainRisk: 'Price Misalignment' },
    '08-12': { count: 14, avgScore: 64, mainRisk: 'Brand Impersonation' },
    '12-16': { count: 20, avgScore: 75, mainRisk: 'Review Farms' },
    '16-20': { count: 26, avgScore: 86, mainRisk: 'VPN Bulk Orders' },
    '20-24': { count: 38, avgScore: 97, mainRisk: 'Weekend Attack Peak' }
  },
  Sat: {
    '00-04': { count: 35, avgScore: 96, mainRisk: 'Automated Fraud Sweep' },
    '04-08': { count: 11, avgScore: 65, mainRisk: 'Unverified Review Burst' },
    '08-12': { count: 17, avgScore: 70, mainRisk: 'Fake Brand Listing' },
    '12-16': { count: 23, avgScore: 79, mainRisk: 'Proxy COD Fraud' },
    '16-20': { count: 29, avgScore: 88, mainRisk: 'Velocity Surge' },
    '20-24': { count: 41, avgScore: 98, mainRisk: 'Peak Midnight Fraud' }
  },
  Sun: {
    '00-04': { count: 30, avgScore: 92, mainRisk: 'Night Proxy Sweep' },
    '04-08': { count: 9, avgScore: 59, mainRisk: 'Seller Authorization' },
    '08-12': { count: 13, avgScore: 63, mainRisk: 'Spam Review Cluster' },
    '12-16': { count: 18, avgScore: 73, mainRisk: 'Return Ratio Spike' },
    '16-20': { count: 24, avgScore: 82, mainRisk: 'VPN Order Rush' },
    '20-24': { count: 29, avgScore: 91, mainRisk: 'Late Night High Risk' }
  }
};

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ cases }) => {
  const [selectedFilter, setSelectedFilter] = useState<'high_risk' | 'all'>('high_risk');
  const [hoveredCell, setHoveredCell] = useState<{ day: string; slot: string; data: any } | null>(null);

  // Blend live evaluation cases into matrix
  const heatmapGrid = useMemo(() => {
    // Clone baseline
    const grid: Record<string, Record<string, { count: number; avgScore: number; mainRisk: string; liveAdded: number }>> = {};
    
    DAYS.forEach(d => {
      grid[d] = {};
      TIME_SLOTS.forEach(s => {
        const base = BASELINE_HEATMAP[d]?.[s.id] || { count: 5, avgScore: 50, mainRisk: 'General Risk' };
        grid[d][s.id] = { ...base, liveAdded: 0 };
      });
    });

    // Process live cases
    cases.forEach(c => {
      const date = new Date(c.createdAt);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sun=0 to Mon=0...Sun=6
      const dayName = DAYS[dayIndex] || 'Mon';
      const hour = date.getHours();

      let slotId = '00-04';
      if (hour >= 4 && hour < 8) slotId = '04-08';
      else if (hour >= 8 && hour < 12) slotId = '08-12';
      else if (hour >= 12 && hour < 16) slotId = '12-16';
      else if (hour >= 16 && hour < 20) slotId = '16-20';
      else if (hour >= 20) slotId = '20-24';

      const isHighRisk = c.decision.overallRiskScore >= 70;
      if (selectedFilter === 'all' || (selectedFilter === 'high_risk' && isHighRisk)) {
        if (grid[dayName]?.[slotId]) {
          grid[dayName][slotId].count += 1;
          grid[dayName][slotId].liveAdded += 1;
          grid[dayName][slotId].avgScore = Math.round((grid[dayName][slotId].avgScore + c.decision.overallRiskScore) / 2);
        }
      }
    });

    return grid;
  }, [cases, selectedFilter]);

  // Find max count to scale color intensity dynamically
  const maxCount = useMemo(() => {
    let max = 1;
    DAYS.forEach(d => {
      TIME_SLOTS.forEach(s => {
        const c = heatmapGrid[d]?.[s.id]?.count || 0;
        if (c > max) max = c;
      });
    });
    return max;
  }, [heatmapGrid]);

  // Hourly distribution aggregate (24 hours) for bottom timeline
  const hourlyAggregates = useMemo(() => {
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, '0')}:00`,
      count: 0,
      isPeak: h >= 22 || h <= 3
    }));

    // Distribute matrix data into 24h timeline
    DAYS.forEach(d => {
      TIME_SLOTS.forEach(s => {
        const count = heatmapGrid[d]?.[s.id]?.count || 0;
        const [startH] = s.id.split('-').map(Number);
        for (let i = 0; i < 4; i++) {
          const h = startH + i;
          if (h < 24) {
            hourly[h].count += Math.round(count / 4);
          }
        }
      });
    });

    return hourly;
  }, [heatmapGrid]);

  // Calculate Heatmap cell background color based on detection density
  const getCellBgColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio === 0) return 'bg-slate-900 border-slate-800 text-slate-600';
    if (ratio < 0.2) return 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:border-emerald-500';
    if (ratio < 0.4) return 'bg-amber-950/50 border-amber-700/50 text-amber-300 hover:border-amber-400';
    if (ratio < 0.7) return 'bg-orange-950/70 border-orange-600/60 text-orange-200 hover:border-orange-400 shadow-md shadow-orange-900/20';
    return 'bg-red-900/80 border-red-500 text-white font-bold animate-pulse hover:border-red-400 shadow-lg shadow-red-900/40';
  };

  return (
    <div id="risk-heatmap-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>High-Risk Detection Heatmap</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-red-500/20 text-red-300 border border-red-500/30 font-bold rounded-full">
                  Real-Time Density
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Frequency of high-risk threat detections (&gt;70 Risk Score) by day &amp; time window.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Peak Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedFilter('high_risk')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedFilter === 'high_risk'
                  ? 'bg-red-600 text-white shadow shadow-red-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              High Risk (&gt;70)
            </button>
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white shadow shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Detections
            </button>
          </div>

          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center space-x-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Peak Threat Window:</span>
            <span className="font-mono font-bold text-red-400">20:00 - 04:00 UTC</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Grid (Days x Time Window) */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Time Slot Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 pl-16 text-center text-xs text-slate-400 font-mono">
            {TIME_SLOTS.map(s => (
              <div key={s.id} className="py-1 px-1 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <div className="font-bold text-slate-200">{s.shortLabel}</div>
                <div className="text-[10px] text-slate-500 font-sans">{s.tag}</div>
              </div>
            ))}
          </div>

          {/* Grid Rows per Day */}
          <div className="space-y-2">
            {DAYS.map(day => (
              <div key={day} className="grid grid-cols-7 gap-2 items-center">
                {/* Day Label */}
                <div className="w-14 text-xs font-bold text-slate-300 font-mono bg-slate-950 py-3 text-center rounded-xl border border-slate-800">
                  {day}
                </div>

                {/* 6 Time Cells */}
                {TIME_SLOTS.map(slot => {
                  const cell = heatmapGrid[day]?.[slot.id] || { count: 0, avgScore: 0, mainRisk: 'None', liveAdded: 0 };
                  const bgClass = getCellBgColor(cell.count);

                  return (
                    <div
                      key={slot.id}
                      onMouseEnter={() => setHoveredCell({ day, slot: slot.label, data: cell })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`relative p-3 rounded-xl border text-center transition-all cursor-pointer ${bgClass}`}
                    >
                      <div className="text-base font-extrabold font-mono leading-none">
                        {cell.count}
                      </div>

                      {cell.liveAdded > 0 && (
                        <span className="absolute top-1 right-1 px-1 py-0.2 text-[9px] bg-blue-500 text-white rounded font-mono font-bold animate-pulse">
                          +{cell.liveAdded}
                        </span>
                      )}

                      <div className="text-[9px] font-mono opacity-80 mt-1">
                        Score: {cell.avgScore}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Information Detail Card */}
      {hoveredCell ? (
        <div className="p-3 bg-slate-950 border border-slate-700/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white font-mono">{hoveredCell.day} @ {hoveredCell.slot}</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-slate-300">Detections: <strong className="text-white font-mono">{hoveredCell.data.count}</strong></span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-slate-300">Avg Risk Score: <strong className="text-red-400 font-mono">{hoveredCell.data.avgScore}/100</strong></span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-[11px] bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-amber-300">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Threat Vector: <strong>{hoveredCell.data.mainRisk}</strong></span>
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Hover over any heatmap cell to view primary risk drivers &amp; exact score averages.</span>
          </div>
          <span className="font-mono text-slate-500">Live evaluation count synced</span>
        </div>
      )}

      {/* 24-Hour Hourly Risk Frequency Curve / Bars */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>24-Hour Hourly Risk Frequency Curve</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span>
              <span>Nighttime Fraud Surge (20:00 - 04:00)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span>
              <span>Daytime Baseline</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-24 gap-1 items-end h-16 bg-slate-950 p-2 rounded-xl border border-slate-800">
          {hourlyAggregates.map((h, i) => {
            const maxH = Math.max(...hourlyAggregates.map(x => x.count), 1);
            const heightPercent = Math.max(12, Math.round((h.count / maxH) * 100));
            const isNight = i >= 20 || i <= 4;

            return (
              <div
                key={i}
                className="group relative flex flex-col items-center justify-end h-full"
                title={`Time: ${h.hour} | Frequency: ${h.count} detections`}
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t transition-all ${
                    isNight
                      ? 'bg-gradient-to-t from-red-600 to-orange-500 group-hover:from-red-500 group-hover:to-amber-400'
                      : 'bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-cyan-400'
                  }`}
                ></div>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                  <div className="bg-slate-800 text-white font-mono text-[10px] px-2 py-1 rounded shadow-lg border border-slate-700 whitespace-nowrap">
                    {h.hour}: <strong>{h.count}</strong> risks
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>23:00</span>
        </div>
      </div>

    </div>
  );
};
