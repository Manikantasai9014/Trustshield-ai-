import React, { useState } from 'react';
import { User, ShieldCheck, Check, LogIn, Key, Mail, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, user } = useAuth();

  const [email, setEmail] = useState<string>(user?.email || 'alex.vance@trustshield.ai');
  const [name, setName] = useState<string>(user?.name || 'Alex Vance');
  const [role, setRole] = useState<UserRole>(user?.role || 'trust_lead');

  if (!isAuthModalOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, role, name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 text-xs shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">User Session &amp; Role Config</h3>
              <p className="text-[11px] text-slate-400">Switch user profile or role to simulate workflows</p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-white text-base font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          <div>
            <label className="text-slate-300 font-bold block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">Select Persona Role</label>
            <div className="space-y-2 pt-1">
              
              <label
                onClick={() => setRole('trust_lead')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  role === 'trust_lead' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <span className="font-bold block">Trust &amp; Safety Lead</span>
                  <span className="text-[10px] text-slate-400">Full override authority &amp; system stats access</span>
                </div>
                {role === 'trust_lead' && <Check className="w-4 h-4 text-blue-400" />}
              </label>

              <label
                onClick={() => setRole('fraud_analyst')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  role === 'fraud_analyst' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <span className="font-bold block">Fraud Operations Analyst</span>
                  <span className="text-[10px] text-slate-400">Inspect IEEE-CIS signals &amp; COD return abuse</span>
                </div>
                {role === 'fraud_analyst' && <Check className="w-4 h-4 text-blue-400" />}
              </label>

              <label
                onClick={() => setRole('merchant_reviewer')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  role === 'merchant_reviewer' ? 'bg-blue-600/20 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div>
                  <span className="font-bold block">Brand Authenticity Inspector</span>
                  <span className="text-[10px] text-slate-400">Computer vision logo &amp; counterfeit MSRP review</span>
                </div>
                {role === 'merchant_reviewer' && <Check className="w-4 h-4 text-blue-400" />}
              </label>

            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
            >
              Save Profile
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
