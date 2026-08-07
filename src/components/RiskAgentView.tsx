import React, { useState } from 'react';
import { CreditCard, ShieldAlert, Cpu, AlertCircle, CheckCircle2, Sliders, Database, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RiskAgentView: React.FC = () => {
  const { cases } = useAuth();
  const sampleCase = cases[0] || null;

  const [simCodReturnRatio, setSimCodReturnRatio] = useState<number>(65);
  const [simIsVpn, setSimIsVpn] = useState<boolean>(true);
  const [simVelocity, setSimVelocity] = useState<number>(5);

  // Compute simulated risk score dynamically for interactive learning
  const computedRisk = Math.min(
    100,
    15 + (simIsVpn ? 35 : 0) + (simCodReturnRatio > 50 ? 30 : simCodReturnRatio > 25 ? 15 : 0) + (simVelocity > 3 ? 20 : 0)
  );

  return (
    <div id="risk-agent-view" className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Agent 1: Transaction &amp; COD Risk Agent</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                40% Weight in Decision Engine
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Trained on IEEE-CIS Fraud Detection dataset patterns to identify COD return abuse, proxy IP locations, and velocity spikes.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: IEEE-CIS Feature Matrix */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span>IEEE-CIS Fraud Benchmark Signals</span>
            </h2>
            <span className="text-xs text-slate-400">Dataset Size: 590,000+ Transactions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>V_130 Anomaly Feature</span>
                <span className="text-blue-400 font-mono font-bold">IEEE-CIS</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">V130 = 4.2 (High Risk)</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Measures transactional match variance across device, IP location, and card issuing country. Value &gt; 3.8 correlates with 89% fraud likelihood.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>COD Return Abuse Ratio</span>
                <span className="text-red-400 font-mono font-bold">Critical</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">&gt; 40% Return History</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Detects coordinated Cash on Delivery (COD) order placement with intent to reject packages upon delivery, incurring heavy logistics loss.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>Network &amp; IP Fingerprint</span>
                <span className="text-amber-400 font-mono font-bold">Threat Check</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">Datacenter Proxy Range</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Cross-references user IP against residential vs datacenter proxy blocklists and anonymizing VPN tunnels.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-400 font-medium">
                <span>24-Hour Velocity C14</span>
                <span className="text-purple-400 font-mono font-bold">Frequency</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">&gt; 3 Orders / 24h</div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Identifies rapid automated script order generation across multiple fake recipient addresses.
              </p>
            </div>

          </div>

          {/* Real Case Breakdown Sample */}
          {sampleCase && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Active Case Breakdown ({sampleCase.id})</span>
                <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">
                  Score: {sampleCase.riskAgent.score}/100
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{sampleCase.riskAgent.explanation}</p>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Evaluated Risk Signals:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {sampleCase.riskAgent.signals.map((s, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-white">{s.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{s.detail}</div>
                      </div>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded shrink-0 ${
                        s.riskImpact === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {s.riskImpact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Interactive COD & Fraud Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              <span>Risk Agent Parameter Simulator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Test how COD return ratio and VPN usage affect fraud probability.</p>
          </div>

          <div className="space-y-5 text-xs">
            
            {/* Slider 1: COD Return Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>COD Past Return Ratio:</span>
                <span className="text-blue-400 font-mono font-bold">{simCodReturnRatio}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simCodReturnRatio}
                onChange={(e) => setSimCodReturnRatio(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Clean)</span>
                <span>50% (High Abuse)</span>
                <span>100% (Pure Fraud)</span>
              </div>
            </div>

            {/* Checkbox 2: VPN Proxy */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="font-semibold text-white block">Datacenter Proxy / VPN</span>
                <span className="text-[10px] text-slate-500">+35 Risk Impact</span>
              </div>
              <input
                type="checkbox"
                checked={simIsVpn}
                onChange={(e) => setSimIsVpn(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Slider 3: Velocity */}
            <div className="space-y-2">
              <div className="flex justify-between text-slate-300 font-semibold">
                <span>24h Order Velocity:</span>
                <span className="text-blue-400 font-mono font-bold">{simVelocity} Orders</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={simVelocity}
                onChange={(e) => setSimVelocity(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Simulated Result Gauge */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Simulated Agent 1 Output</span>
              <div className="text-4xl font-extrabold text-white font-mono">{computedRisk} <span className="text-sm font-normal text-slate-500">/ 100</span></div>
              <div className="text-xs">
                {computedRisk > 70 ? (
                  <span className="text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/30">
                    High Risk Flag (Requires Block)
                  </span>
                ) : computedRisk > 40 ? (
                  <span className="text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    Medium Risk (Manual Inspection)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                    Low Risk (Auto Pass)
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
