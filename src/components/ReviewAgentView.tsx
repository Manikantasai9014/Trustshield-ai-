import React, { useState } from 'react';
import { MessageSquare, AlertTriangle, CheckCircle2, Bot, Sparkles, User, FileText, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ReviewAgentView: React.FC = () => {
  const { cases } = useAuth();
  const sampleCase = cases[0] || null;

  const [testText, setTestText] = useState<string>(
    "This product is absolutely super extraordinary and transcendent! The craftsmanship is remarkably divine. Best purchase ever made!"
  );

  const keywords = ["super", "extraordinary", "transcendent", "craftsmanship", "divine", "best purchase ever"];
  const matches = keywords.filter((k) => testText.toLowerCase().includes(k));
  const simAiScore = Math.min(99, 10 + matches.length * 20);

  return (
    <div id="review-agent-view" className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Agent 3: Review Moderation Agent</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                30% Weight in Decision Engine
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Leverages Amazon Fake Reviews &amp; OpSpam dataset patterns to detect synthetic, AI-generated, or incentivized reviews.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Review Text Analyzer */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              <span>Linguistic NLP &amp; OpSpam Pattern Recognition</span>
            </h2>
            <span className="text-xs text-slate-400">Dataset: OpSpam + Amazon Fake Reviews</span>
          </div>

          {sampleCase ? (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-white">Review ID: {sampleCase.input.review.reviewId || "REV-10492"}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sampleCase.input.review.verifiedPurchase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {sampleCase.input.review.verifiedPurchase ? "Verified Purchase" : "Unverified Buyer"}
                  </span>
                </div>
                <span className="font-mono font-extrabold text-white text-sm bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/30">
                  {sampleCase.reviewAgent.score}/100 Risk
                </span>
              </div>

              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Raw Review Text</span>
                <p className="text-slate-200 text-sm leading-relaxed font-serif italic">
                  "{sampleCase.input.review.reviewText}"
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Classification</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">{sampleCase.reviewAgent.classification}</span>
                  <span className="text-[10px] text-emerald-400">{sampleCase.reviewAgent.confidenceScorePercent}% Confidence</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Sentiment Exaggeration</span>
                  <span className="text-sm font-bold text-amber-400 mt-0.5 block">{sampleCase.reviewAgent.nlpMetrics.sentimentExaggeration}</span>
                  <span className="text-[10px] text-slate-500">Superlative Adjective Ratio</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Detection Reasons:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {sampleCase.reviewAgent.reasons.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs py-8">No active review loaded.</div>
          )}

        </div>

        {/* Right Column: Live NLP Text Sandbox */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Fake Review Text Sandbox</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Test custom review text against LLM pattern triggers.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Enter Review Text</label>
              <textarea
                rows={4}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-emerald-500 outline-none leading-relaxed"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-slate-400">
                <span>Flagged Hyperbolic Words:</span>
                <span className="text-emerald-400 font-bold">{matches.length} Detected</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matches.length > 0 ? (
                  matches.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 bg-red-500/20 text-red-300 font-mono text-[10px] rounded border border-red-500/30">
                      {m}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 text-[11px]">No generic hyperbolic triggers found.</span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 text-center">
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider block">Estimated AI Text Score</span>
                <div className="text-3xl font-extrabold text-white font-mono mt-1">{simAiScore} <span className="text-xs text-slate-500">/ 100</span></div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
