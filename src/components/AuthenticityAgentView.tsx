import React, { useState } from 'react';
import { ShieldAlert, Image, DollarSign, CheckCircle2, AlertTriangle, Ban, Eye, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthenticityAgentView: React.FC = () => {
  const { cases } = useAuth();
  const sampleCase = cases[0] || null;

  const [listedPrice, setListedPrice] = useState<number>(149);
  const [msrpPrice, setMsrpPrice] = useState<number>(549);

  // Compute MSRP Variance %
  const priceDiffPercent = msrpPrice > 0 ? Math.round(((listedPrice - msrpPrice) / msrpPrice) * 100) : 0;
  const isSuspiciousDiscount = priceDiffPercent < -50;

  return (
    <div id="auth-agent-view" className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Agent 2: Authenticity &amp; Integrity Agent</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                30% Weight in Decision Engine
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Detects counterfeit product listings, unauthorized brand logos, packaging anomalies, and price variance vs official MSRP.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Image Vision Inspection & Logo Verification */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-400" />
              <span>Computer Vision Logo &amp; Packaging Inspection</span>
            </h2>
            <span className="text-xs text-slate-400">Dataset: Counterfeit Product &amp; Logo</span>
          </div>

          {/* Product Image Preview with Visual Bounding Bounding Box Overlays */}
          {sampleCase ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                
                {/* Image Container */}
                <div className="relative w-full sm:w-48 h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 group">
                  <img
                    src={sampleCase.input.listing.imageUrl || "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80"}
                    alt={sampleCase.input.listing.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Computer Vision Simulated Bounding Box */}
                  <div className="absolute inset-4 border-2 border-dashed border-red-500 rounded-lg flex items-center justify-center bg-red-500/10">
                    <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded absolute top-1 left-1">
                      Logo Alignment Deviation 4.2%
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">{sampleCase.input.listing.title}</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 shrink-0">
                      Score: {sampleCase.authenticityAgent.score}/100 Risk
                    </span>
                  </div>

                  {/* ASIN Tag */}
                  {sampleCase.input.listing.asin && (
                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-[10px] font-mono text-amber-400 font-semibold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        ASIN: {sampleCase.input.listing.asin}
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                    <div>
                      <span className="text-slate-500 block">Brand:</span>
                      <span className="text-white font-semibold">{sampleCase.input.listing.brand}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Listed Price vs MSRP:</span>
                      <span className="text-amber-400 font-mono font-bold">
                        ${sampleCase.input.listing.listedPrice} / ${sampleCase.input.listing.msrpPrice}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed pt-1">{sampleCase.authenticityAgent.explanation}</p>
                </div>

              </div>

              {/* 4 Check Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Logo Consistency</span>
                    <span className={sampleCase.authenticityAgent.checks.logoConsistency.status === 'Pass' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {sampleCase.authenticityAgent.checks.logoConsistency.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{sampleCase.authenticityAgent.checks.logoConsistency.detail}</p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Packaging Quality</span>
                    <span className={sampleCase.authenticityAgent.checks.packagingQuality.status === 'Pass' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {sampleCase.authenticityAgent.checks.packagingQuality.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{sampleCase.authenticityAgent.checks.packagingQuality.detail}</p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Price vs MSRP</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {sampleCase.authenticityAgent.checks.priceMsrpComparison.priceDiffPercent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{sampleCase.authenticityAgent.checks.priceMsrpComparison.detail}</p>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Authorized Merchant</span>
                    <span className="text-slate-300 font-medium">
                      {sampleCase.authenticityAgent.checks.brandAuthorizedSeller.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{sampleCase.authenticityAgent.checks.brandAuthorizedSeller.detail}</p>
                </div>

              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">No active case loaded. Run Live Evaluator to inspect real item.</div>
          )}

        </div>

        {/* Right Column: MSRP Price Variance Calculator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>MSRP Price Anomaly Calculator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Counterfeits are frequently priced 60–80% below retail MSRP.</p>
          </div>

          <div className="space-y-4 text-xs">
            
            <div>
              <label className="text-slate-400 font-medium block mb-1">Listed Price ($)</label>
              <input
                type="number"
                value={listedPrice}
                onChange={(e) => setListedPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Official Brand MSRP ($)</label>
              <input
                type="number"
                value={msrpPrice}
                onChange={(e) => setMsrpPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 outline-none"
              />
            </div>

            {/* Price Variance Badge */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Calculated Price Variance</span>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                {priceDiffPercent}%
              </div>
              <p className="text-[11px] text-slate-400">
                {isSuspiciousDiscount
                  ? "CRITICAL: Discount exceeds 50% threshold. Highly correlated with counterfeit stock."
                  : "Normal retail or standard promotional discount range."}
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
