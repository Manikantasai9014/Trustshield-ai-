import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuditCase, SystemStats } from '../types';
import { fetchCurrentUser, loginUser as apiLoginUser, fetchStats, fetchCases } from '../services/api';

import { AmazonProductItem } from '../components/AmazonProductSearch';

export type NavTab = 
  | 'dashboard' 
  | 'evaluator' 
  | 'risk_agent' 
  | 'auth_agent' 
  | 'review_agent' 
  | 'decision_engine' 
  | 'dataset_benchmarks' 
  | 'cases_vault'
  | 'email_alerts'
  | 'amazon_search';

interface AuthContextType {
  user: User | null;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedCase: AuditCase | null;
  setSelectedCase: (c: AuditCase | null) => void;
  selectedAmazonProduct: AmazonProductItem | null;
  setSelectedAmazonProduct: (p: AmazonProductItem | null) => void;
  stats: SystemStats | null;
  cases: AuditCase[];
  lastSynced: Date | null;
  refreshData: () => Promise<void>;
  login: (email: string, role: string, name?: string) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedCase, setSelectedCase] = useState<AuditCase | null>(null);
  const [selectedAmazonProduct, setSelectedAmazonProduct] = useState<AmazonProductItem | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [cases, setCases] = useState<AuditCase[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const refreshData = async () => {
    try {
      const [uData, sData, cData] = await Promise.all([
        fetchCurrentUser(),
        fetchStats(),
        fetchCases()
      ]);
      setUser(uData.user);
      setStats(sData);
      setCases(cData.cases);
      setLastSynced(new Date());
      if (cData.cases.length > 0 && !selectedCase) {
        setSelectedCase(cData.cases[0]);
      }
    } catch (err) {
      console.error('Error refreshing app data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const login = async (email: string, role: string, name?: string) => {
    const res = await apiLoginUser(email, role, name);
    setUser(res.user);
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeTab,
        setActiveTab,
        selectedCase,
        setSelectedCase,
        selectedAmazonProduct,
        setSelectedAmazonProduct,
        stats,
        cases,
        lastSynced,
        refreshData,
        login,
        isAuthModalOpen,
        setIsAuthModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
