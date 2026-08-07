import React, { useState } from 'react';
import {
  Scale,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Eye,
  Edit3,
  UserCheck,
  FileSpreadsheet,
  Clock,
  ChevronDown,
  Layers,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { overrideCaseDecision } from '../services/api';
import { AuditCase, FinalDecision } from '../types';

export const DecisionEngineAuditView: React.FC = () => {
  const { cases, selectedCase, setSelectedCase, refreshData, user } = useAuth();

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Override Modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState<boolean>(false);
  const [newOverrideStatus, setNewOverrideStatus] = useState<FinalDecision>('Approve');
  const [overrideNotes, setOverrideNotes] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState<boolean>(false);

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.input.listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.input.listing.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.input.transaction.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle Override Submit
  const handleSaveOverride = async () => {
    if (!selectedCase) return;
    setIsSubmittingOverride(true);
    try {
      const res = await overrideCaseDecision(selectedCase.id, newOverrideStatus, overrideNotes);
      setSelectedCase(res.case);
      setOverrideModalOpen(false);
      setOverrideNotes('');
      await refreshData();
    } catch (err) {
      console.error(err);
      alert('Failed to save human override.');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  return (
    <div id="decision-engine-view" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-purple-400" />
            <span>Decision Engine &amp; Audit Vault</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Transparent explainable AI decisions, weighted agent score fusion, human overrides, and full audit logs.
          </p>
        </div>

        {/* Export JSON / CSV button */}
        <a
          href="/api/cases/export"
          download
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer w-fit"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Export Audit Log (JSON)</span>
        </a>
      </div>

      {/* Decision Engine Formula Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Decision Engine Formula &amp; Policy Bounds</h2>
              <p className="text-xs text-slate-400">Combined Score = 40% Risk Agent + 30% Authenticity Agent + 30% Review Moderation Agent</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg">0–40: Approve</span>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg">41–70: Manual Review</span>
            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg">&gt;70: Block</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Case ID, product, brand, payment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'Approved', 'Under Manual Review', 'Blocked'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

      </div>

      {/* Vault Split View: Left List, Right Selected Case Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Case List (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-0">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Audit Vault Cases ({filteredCases.length})</span>
            <span className="text-[10px] text-slate-500">Real-time DB Sync</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[600px] overflow-y-auto">
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-4 cursor-pointer transition-colors space-y-2 ${
                    isSelected ? 'bg-blue-600/15 border-l-4 border-l-blue-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-400">{c.id}</span>
                    <span className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <div className="font-medium text-white text-xs truncate">{c.input.listing.title}</div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">${c.input.transaction.amount.toFixed(2)} ({c.input.transaction.paymentMethod})</span>
                    
                    {c.status === "Blocked" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400">Blocked</span>
                    )}
                    {c.status === "Under Manual Review" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">Manual Review</span>
                    )}
                    {c.status === "Approved" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Approved</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Case Inspector & Override Trigger (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          {selectedCase ? (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-bold text-blue-400">{selectedCase.id}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{new Date(selectedCase.createdAt).toLocaleString()}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedCase.input.listing.title}</h2>
                  
                  {/* ASIN Badge */}
                  {selectedCase.input.listing.asin && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-semibold">
                        ASIN: {selectedCase.input.listing.asin}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setOverrideModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shadow transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Human Override</span>
                </button>
              </div>

              {/* Human Override Badge if overridden */}
              {selectedCase.humanOverride && (
                <div className="bg-purple-950/60 border border-purple-500/40 p-4 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-400" /> Human Override Recorded
                    </span>
                    <span>New Status: {selectedCase.humanOverride.status}</span>
                  </div>
                  <p className="text-slate-300">
                    Overridden by <span className="text-white font-semibold">{selectedCase.humanOverride.overriddenBy}</span> on {new Date(selectedCase.humanOverride.overrideTime).toLocaleString()}
                  </p>
                  <p className="text-slate-400 italic">"{selectedCase.humanOverride.notes}"</p>
                </div>
              )}

              {/* Overall Decision & Score Gauge */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Decision Engine Evaluation</span>
                  <span className="font-mono font-bold text-xl text-white">Score: {selectedCase.decision.overallRiskScore} / 100</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedCase.decision.summaryReasoning}</p>
              </div>

              {/* 3 Agents Score Cards */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/30 text-center">
                  <span className="text-blue-400 font-bold block mb-1">Agent 1: Risk</span>
                  <span className="text-xl font-bold font-mono text-white">{selectedCase.riskAgent.score}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">{selectedCase.riskAgent.riskLevel} Risk</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-center">
                  <span className="text-amber-400 font-bold block mb-1">Agent 2: Authenticity</span>
                  <span className="text-xl font-bold font-mono text-white">{selectedCase.authenticityAgent.score}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">{selectedCase.authenticityAgent.authenticityScore}% Genuine</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 text-center">
                  <span className="text-emerald-400 font-bold block mb-1">Agent 3: Review</span>
                  <span className="text-xl font-bold font-mono text-white">{selectedCase.reviewAgent.score}</span>
                  <span className="text-[10px] text-slate-500 block mt-1">{selectedCase.reviewAgent.classification}</span>
                </div>
              </div>

              {/* Input Context Details */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation Context Input</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                  <div>Payment: <span className="text-white font-semibold">{selectedCase.input.transaction.paymentMethod}</span></div>
                  <div>IP Proxy: <span className="text-white font-semibold">{selectedCase.input.transaction.isVpnOrProxy ? "VPN Flagged" : "Residential"}</span></div>
                  <div>Listed Price: <span className="text-white font-semibold">${selectedCase.input.listing.listedPrice}</span></div>
                  <div>Brand: <span className="text-white font-semibold">{selectedCase.input.listing.brand}</span></div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs py-12">Select a case from the list on the left to inspect audit logs.</div>
          )}
        </div>

      </div>

      {/* Human Override Modal */}
      {overrideModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                <span>Human Decision Override</span>
              </h3>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-slate-400 block mb-1">Target Case ID:</span>
                <span className="font-mono font-bold text-blue-400">{selectedCase.id}</span>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Select New Override Decision:</label>
                <select
                  value={newOverrideStatus}
                  onChange={(e) => setNewOverrideStatus(e.target.value as FinalDecision)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold outline-none"
                >
                  <option value="Approve">Approve (Force Pass)</option>
                  <option value="Manual Review">Hold for Secondary Review</option>
                  <option value="Block">Block (Force Fraud Rejection)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Analyst Audit Justification Notes:</label>
                <textarea
                  rows={3}
                  placeholder="Explain why the automated multi-agent decision is being overridden..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={isSubmittingOverride || !overrideNotes.trim()}
                onClick={handleSaveOverride}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                {isSubmittingOverride ? "Recording..." : "Record Human Override"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
