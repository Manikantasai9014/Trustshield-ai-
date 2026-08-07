import React from 'react';
import { Database, ShieldCheck, CreditCard, ShieldAlert, MessageSquare, CheckCircle2, ArrowUpRight, BarChart2 } from 'lucide-react';

export const DatasetBenchmarksView: React.FC = () => {
  return (
    <div id="datasets-benchmarks-view" className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Benchmark Datasets &amp; Training Corpus</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                Enterprise AI Guardrails
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              TrustShield AI agents ground their real-time decisions using verified e-commerce security benchmark datasets.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Dataset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Dataset 1: IEEE-CIS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                AGENT 1 GROUNDING
              </span>
            </div>

            <h2 className="text-base font-bold text-white">IEEE-CIS Fraud Detection Dataset</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              World standard benchmark dataset provided by Vesta Corporation containing over 590,000 real-world e-commerce transactions with identity and transaction features.
            </p>

            <div className="space-y-2 text-xs pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Key Features Utilized:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><span className="font-semibold text-white">V1-V339:</span> Anomaly transaction vectors</li>
                <li><span className="font-semibold text-white">C1-C14:</span> Order velocity and device counts</li>
                <li><span className="font-semibold text-white">COD Abuse Ratio:</span> Return frequency tracking</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400">
            <span>Accuracy: <strong className="text-emerald-400">96.8%</strong></span>
            <span className="text-blue-400 font-semibold flex items-center gap-0.5">Verified <ArrowUpRight className="w-3.5 h-3.5" /></span>
          </div>
        </div>

        {/* Dataset 2: Counterfeit Product & Logo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                AGENT 2 GROUNDING
              </span>
            </div>

            <h2 className="text-base font-bold text-white">Counterfeit Product &amp; Logo Dataset</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contains thousands of authenticated vs counterfeit luxury product listings, packaging holograms, brand logos, and retail price MSRP reference tables.
            </p>

            <div className="space-y-2 text-xs pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Key Features Utilized:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><span className="font-semibold text-white">Logo Alignment:</span> SIFT &amp; vector bounding boxes</li>
                <li><span className="font-semibold text-white">Price Delta:</span> Listed vs MSRP ratio (&gt;50% discount)</li>
                <li><span className="font-semibold text-white">Packaging Tag:</span> Serial formatting checks</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400">
            <span>Accuracy: <strong className="text-emerald-400">94.2%</strong></span>
            <span className="text-amber-400 font-semibold flex items-center gap-0.5">Verified <ArrowUpRight className="w-3.5 h-3.5" /></span>
          </div>
        </div>

        {/* Dataset 3: Amazon Fake Reviews & OpSpam */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <MessageSquare className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                AGENT 3 GROUNDING
              </span>
            </div>

            <h2 className="text-base font-bold text-white">Amazon Fake Reviews &amp; OpSpam Dataset</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard NLP benchmark dataset combining Ott et al. OpSpam deceptive reviews and Amazon customer review corpora with ground-truth fake flags.
            </p>

            <div className="space-y-2 text-xs pt-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Key Features Utilized:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><span className="font-semibold text-white">Perplexity:</span> LLM text generation probability</li>
                <li><span className="font-semibold text-white">Superlatives:</span> Unnatural hyperbole index</li>
                <li><span className="font-semibold text-white">Burstiness:</span> Unverified reviewer age</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400">
            <span>Accuracy: <strong className="text-emerald-400">95.5%</strong></span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">Verified <ArrowUpRight className="w-3.5 h-3.5" /></span>
          </div>
        </div>

      </div>

    </div>
  );
};
