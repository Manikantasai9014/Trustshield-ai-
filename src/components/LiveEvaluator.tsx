import React, { useState, useRef } from 'react';
import {
  Zap,
  Play,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  ShieldAlert,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Sliders,
  Check,
  Upload,
  FileSpreadsheet,
  Download,
  FileText,
  Eye,
  X,
  Filter,
  CheckSquare,
  History,
  Trash2,
  Clock,
  Search,
  ExternalLink,
  RefreshCw,
  Bell,
  Mail,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { runEvaluation, runBatchEvaluation } from '../services/api';
import { EvaluationInput, AuditCase, MockEmailAlert } from '../types';
import { SAMPLE_CASES } from '../data/sampleCases';
import { PRESET_AMAZON_PRODUCTS, AmazonProductItem } from './AmazonProductSearch';

const SAMPLE_BATCH_CSV = `Product Title,Brand,Listed Price ($),MSRP Price ($),Payment Method,Amount ($),Is VPN (true/false),COD Return Ratio (%),Velocity 24h,Review Text,Verified Purchase (true/false)
"Chronos Luxury Diver Watch","Chronos Precision",149,650,"Credit Card",149,true,20,2,"Extraordinary divine craftsmanship best watch ever made super transcendent!",false
"UltraBook Pro 15 Laptop","TechCorp",899,999,"COD (Cash on Delivery)",899,true,75,6,"Good build quality and fast shipping to home address.",true
"Genuine Leather Travel Bag","Heritage Goods",120,130,"Credit Card",120,false,0,1,"Heavy duty leather, sturdy zips, arrived in 2 days.",true
"Wireless Noise-Canceling Earbuds","SoundPulse",29,199,"Digital Wallet",29,true,10,8,"Life changing transcendent earbuds! Absolutely divine experience!",false
"Organic Cotton T-Shirt 3-Pack","BasicWear",35,35,"BNPL (Buy Now Pay Later)",35,false,5,1,"Standard comfortable shirts, fit as expected.",true
"4K Ultra HD Gaming Monitor","AeroDisplay",199,499,"COD (Cash on Delivery)",199,false,60,3,"Item delivered on time.",false`;

// Utility function to parse CSV robustly taking quotes into account
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const result: string[][] = [];

  for (const line of lines) {
    const row: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    result.push(row);
  }

  return result;
}

// Map parsed CSV rows into EvaluationInput objects
function parseCSVToEvaluationInputs(csvText: string): EvaluationInput[] {
  const matrix = parseCSV(csvText);
  if (matrix.length < 2) return [];

  // Remove header row
  const rows = matrix.slice(1);
  const inputs: EvaluationInput[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 3) continue;

    const title = r[0] || `Batch Product ${i + 1}`;
    const brand = r[1] || 'Generic Brand';
    const listedPrice = parseFloat(r[2]) || 99;
    const msrpPrice = parseFloat(r[3]) || listedPrice;
    const paymentMethod = r[4] || 'Credit Card';
    const amount = parseFloat(r[5]) || listedPrice;
    const isVpnOrProxy = r[6] ? r[6].toLowerCase().includes('true') || r[6] === '1' : false;
    const returnRatioPercent = parseFloat(r[7]) || 0;
    const velocity24h = parseInt(r[8]) || 1;
    const reviewText = r[9] || 'Standard customer feedback provided for this product.';
    const verifiedPurchase = r[10] ? r[10].toLowerCase().includes('true') || r[10] === '1' : true;

    // Calculate past returns count and total orders based on return ratio
    const totalPastOrders = returnRatioPercent > 0 ? 10 : 5;
    const pastReturnsCount = Math.round((returnRatioPercent / 100) * totalPastOrders);

    inputs.push({
      transaction: {
        amount,
        currency: 'USD',
        paymentMethod,
        deviceType: isVpnOrProxy ? 'Mobile Web (Proxied)' : 'Desktop Browser',
        ipAddress: isVpnOrProxy ? '192.241.128.4' : '72.14.201.1',
        isVpnOrProxy,
        customerAgeDays: isVpnOrProxy ? 3 : 120,
        pastReturnsCount,
        totalPastOrders,
        pastChargebacksCount: pastReturnsCount > 2 ? 1 : 0,
        velocity24h
      },
      listing: {
        title,
        brand,
        listedPrice,
        msrpPrice,
        category: 'Consumer Electronics & Goods',
        sellerAgeMonths: 12,
        sellerRating: listedPrice < msrpPrice * 0.5 ? 2.8 : 4.6,
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
      },
      review: {
        reviewText,
        starRating: 5,
        reviewerAccountAgeDays: verifiedPurchase ? 180 : 2,
        verifiedPurchase,
        reviewerTotalReviews: verifiedPurchase ? 14 : 1,
        submissionTime: new Date().toISOString()
      }
    });
  }

  return inputs;
}

export const LiveEvaluator: React.FC = () => {
  const { refreshData, setSelectedCase, setActiveTab, selectedAmazonProduct, setSelectedAmazonProduct } = useAuth();

  // Mode Selection: 'single' vs 'batch'
  const [evalMode, setEvalMode] = useState<'single' | 'batch'>('single');

  // SINGLE MODE STATE
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [formData, setFormData] = useState<EvaluationInput>(SAMPLE_CASES[0].input);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Sync selected Amazon product into form data if passed from Amazon Product Search
  React.useEffect(() => {
    if (selectedAmazonProduct) {
      setFormData({
        transaction: {
          amount: selectedAmazonProduct.amazonPrice,
          paymentMethod: 'Credit Card',
          userAccountAgeDays: 120,
          totalPastOrders: 15,
          pastReturnsCount: selectedAmazonProduct.authenticityRisk === 'High' ? 4 : 1,
          isVpnOrProxy: false,
          velocity24h: 1,
          ipCountry: 'US',
          shippingCountry: 'US'
        },
        listing: {
          title: selectedAmazonProduct.title,
          brand: selectedAmazonProduct.brand,
          listedPrice: selectedAmazonProduct.amazonPrice,
          msrpPrice: selectedAmazonProduct.msrpPrice,
          category: selectedAmazonProduct.category,
          sellerAgeMonths: selectedAmazonProduct.authenticityRisk === 'High' ? 2 : 36,
          sellerRating: selectedAmazonProduct.rating,
          imageUrl: selectedAmazonProduct.imageUrl,
          asin: selectedAmazonProduct.asin,
          amazonUrl: selectedAmazonProduct.amazonUrl
        },
        review: {
          reviewText: selectedAmazonProduct.description,
          starRating: Math.round(selectedAmazonProduct.rating),
          reviewerAccountAgeDays: 180,
          verifiedPurchase: selectedAmazonProduct.isPrime,
          reviewerTotalReviews: selectedAmazonProduct.reviewsCount,
          submissionTime: new Date().toISOString()
        }
      });
      setSelectedPresetIndex(-1);
    }
  }, [selectedAmazonProduct]);
  const [evalStep, setEvalStep] = useState<number>(0);
  const [evalResult, setEvalResult] = useState<AuditCase | null>(null);

  // Quick In-Site Product Search Modal State
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState<string>('');

  const quickSearchResults = React.useMemo(() => {
    const q = quickSearchQuery.trim().toLowerCase();
    let matches = PRESET_AMAZON_PRODUCTS.filter((prod) => {
      if (!q) return true;
      return (
        prod.title.toLowerCase().includes(q) ||
        prod.brand.toLowerCase().includes(q) ||
        prod.asin.toLowerCase().includes(q) ||
        prod.description.toLowerCase().includes(q)
      );
    });

    if (q && matches.length === 0) {
      const formattedTitle = quickSearchQuery.charAt(0).toUpperCase() + quickSearchQuery.slice(1);
      const generatedAsin = `B0${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      const dynamicProd: AmazonProductItem = {
        asin: generatedAsin,
        title: `Official ${formattedTitle} - Verified Listing`,
        brand: formattedTitle.split(' ')[0] || 'Brand Store',
        amazonPrice: 249.99,
        msrpPrice: 299.99,
        category: 'Electronics & Tech',
        rating: 4.7,
        reviewsCount: 1150,
        imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
        sellerName: `${formattedTitle.split(' ')[0]} Official Store`,
        isPrime: true,
        amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(quickSearchQuery)}`,
        description: `High quality ${formattedTitle} listing. Verified seller with authentic warranty.`,
        authenticityRisk: 'Low'
      };

      matches = [dynamicProd];
    }

    return matches;
  }, [quickSearchQuery]);

  const loadAmazonProduct = (product: AmazonProductItem) => {
    if (setSelectedAmazonProduct) {
      setSelectedAmazonProduct(product);
    }
    setFormData({
      transaction: {
        amount: product.amazonPrice,
        paymentMethod: 'Credit Card',
        userAccountAgeDays: 120,
        totalPastOrders: 15,
        pastReturnsCount: product.authenticityRisk === 'High' ? 4 : 1,
        isVpnOrProxy: false,
        velocity24h: 1,
        ipCountry: 'US',
        shippingCountry: 'US'
      },
      listing: {
        title: product.title,
        brand: product.brand,
        listedPrice: product.amazonPrice,
        msrpPrice: product.msrpPrice,
        category: product.category,
        sellerAgeMonths: product.authenticityRisk === 'High' ? 2 : 36,
        sellerRating: product.rating,
        imageUrl: product.imageUrl,
        asin: product.asin,
        amazonUrl: product.amazonUrl
      },
      review: {
        reviewText: product.description,
        starRating: Math.round(product.rating),
        reviewerAccountAgeDays: 180,
        verifiedPurchase: product.isPrime,
        reviewerTotalReviews: product.reviewsCount,
        submissionTime: new Date().toISOString()
      }
    });
    setSelectedPresetIndex(-1);
    setIsQuickSearchOpen(false);
  };

  // BATCH MODE STATE
  const [rawCsvText, setRawCsvText] = useState<string>(SAMPLE_BATCH_CSV);
  const [parsedItems, setParsedItems] = useState<EvaluationInput[]>(() => parseCSVToEvaluationInputs(SAMPLE_BATCH_CSV));
  const [isBatchRunning, setIsBatchRunning] = useState<boolean>(false);
  const [batchProgressIndex, setBatchProgressIndex] = useState<number>(0);
  const [batchResults, setBatchResults] = useState<AuditCase[]>([]);
  const [batchFilterStatus, setBatchFilterStatus] = useState<string>('All');
  const [inspectModalCase, setInspectModalCase] = useState<AuditCase | null>(null);

  // RECENT EVALUATIONS HISTORY STATE (LOCAL STORAGE PERSISTENCE)
  const LOCAL_STORAGE_KEY = 'trustshield_recent_evaluations';
  const [historyCases, setHistoryCases] = useState<AuditCase[]>(() => {
    try {
      const saved = localStorage.getItem('trustshield_recent_evaluations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error('Failed to load recent evaluations from local storage:', err);
    }
    // Seed sample cases into local storage on initial load if empty
    try {
      localStorage.setItem('trustshield_recent_evaluations', JSON.stringify(SAMPLE_CASES));
    } catch (err) {
      console.error('Failed to seed sample evaluations into local storage:', err);
    }
    return SAMPLE_CASES;
  });

  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>('All');
  const [triggeredAlertsNotice, setTriggeredAlertsNotice] = useState<MockEmailAlert[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper function to persist new cases to local storage history
  const saveToHistory = (newCases: AuditCase[]) => {
    setHistoryCases((prevHistory) => {
      const newIds = new Set(newCases.map((c) => c.id));
      const filteredPrev = prevHistory.filter((c) => !newIds.has(c.id));
      const updated = [...newCases, ...filteredPrev].slice(0, 50); // Store up to 50 items
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save evaluations to local storage:', err);
      }
      return updated;
    });
  };

  const handleRemoveFromHistory = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryCases((prev) => {
      const updated = prev.filter((c) => c.id !== caseId);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update local storage history:', err);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all stored recent evaluation history from local storage?')) {
      setHistoryCases([]);
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (err) {
        console.error('Failed to clear local storage history:', err);
      }
    }
  };

  const handleLoadSampleHistory = () => {
    saveToHistory(SAMPLE_CASES);
  };

  const handleReloadIntoEvaluator = (caseItem: AuditCase) => {
    setFormData(JSON.parse(JSON.stringify(caseItem.input)));
    setEvalResult(caseItem);
    setEvalMode('single');
    const resultElem = document.getElementById('live-evaluator-page');
    if (resultElem) {
      resultElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExportHistoryCsv = () => {
    if (historyCases.length === 0) return;

    const headers = ["Case ID", "Created At", "Title", "Brand", "Listed Price", "MSRP", "Payment", "Risk Score", "Risk Agent", "Auth Agent", "Review Agent", "Decision"];
    const rows = historyCases.map((c) => [
      c.id,
      `"${c.createdAt || ''}"`,
      `"${c.input.listing.title.replace(/"/g, '""')}"`,
      `"${c.input.listing.brand.replace(/"/g, '""')}"`,
      c.input.listing.listedPrice,
      c.input.listing.msrpPrice,
      c.input.transaction.paymentMethod,
      c.decision.overallRiskScore,
      c.riskAgent.score,
      c.authenticityAgent.score,
      c.reviewAgent.score,
      c.decision.decision
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trustshield_evaluation_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter history cases
  const filteredHistoryCases = historyCases.filter((c) => {
    if (historyFilterStatus !== 'All') {
      if (historyFilterStatus === 'Approved' && c.decision.decision !== 'Approve') return false;
      if (historyFilterStatus === 'Manual Review' && c.decision.decision !== 'Manual Review') return false;
      if (historyFilterStatus === 'Blocked' && c.decision.decision !== 'Block') return false;
    }
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const titleMatch = c.input.listing.title.toLowerCase().includes(q);
      const brandMatch = c.input.listing.brand.toLowerCase().includes(q);
      const idMatch = c.id.toLowerCase().includes(q);
      const decisionMatch = c.decision.decision.toLowerCase().includes(q);
      const paymentMatch = c.input.transaction.paymentMethod.toLowerCase().includes(q);
      return titleMatch || brandMatch || idMatch || decisionMatch || paymentMatch;
    }
    return true;
  });

  // Handle Preset Select in Single Mode
  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    if (setSelectedAmazonProduct) {
      setSelectedAmazonProduct(null);
    }
    if (SAMPLE_CASES[index]) {
      setFormData(JSON.parse(JSON.stringify(SAMPLE_CASES[index].input)));
      setEvalResult(null);
    }
  };

  // Run Single Evaluation
  const handleExecuteSingle = async () => {
    setIsEvaluating(true);
    setEvalStep(1);

    setTimeout(() => setEvalStep(2), 600);
    setTimeout(() => setEvalStep(3), 1200);
    setTimeout(() => setEvalStep(4), 1800);

    try {
      const res = await runEvaluation(formData);
      setTimeout(() => {
        setEvalResult(res.case);
        if (res.triggeredAlerts && res.triggeredAlerts.length > 0) {
          setTriggeredAlertsNotice(res.triggeredAlerts);
        }
        setIsEvaluating(false);
        setEvalStep(0);
        saveToHistory([res.case]);
        refreshData();
      }, 2200);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to execute evaluation.');
      setIsEvaluating(false);
      setEvalStep(0);
    }
  };

  // Handle Raw CSV Text Change
  const handleCsvTextChange = (text: string) => {
    setRawCsvText(text);
    const parsed = parseCSVToEvaluationInputs(text);
    setParsedItems(parsed);
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawCsvText(content);
        const parsed = parseCSVToEvaluationInputs(content);
        setParsedItems(parsed);
      }
    };
    reader.readAsText(file);
  };

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_BATCH_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trustshield_batch_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run Batch Analysis
  const handleExecuteBatch = async () => {
    if (parsedItems.length === 0) {
      alert('No valid rows found in CSV. Please paste or upload a valid CSV file.');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgressIndex(0);
    setBatchResults([]);

    // Simulate item-by-item progress ticker for realistic multi-agent feedback
    const interval = setInterval(() => {
      setBatchProgressIndex((prev) => {
        if (prev < parsedItems.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    try {
      const res = await runBatchEvaluation(parsedItems);
      clearInterval(interval);
      setBatchProgressIndex(parsedItems.length);
      setTimeout(() => {
        setBatchResults(res.cases);
        if (res.triggeredAlerts && res.triggeredAlerts.length > 0) {
          setTriggeredAlertsNotice(res.triggeredAlerts);
        }
        setIsBatchRunning(false);
        saveToHistory(res.cases);
        refreshData();
      }, 600);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      alert(err.message || 'Failed to execute batch evaluation.');
      setIsBatchRunning(false);
    }
  };

  // Export Batch Results to CSV
  const handleExportBatchResultsCsv = () => {
    if (batchResults.length === 0) return;

    const headers = ["Case ID", "Title", "Brand", "Listed Price", "MSRP", "Payment", "Risk Score", "Risk Agent", "Auth Agent", "Review Agent", "Decision"];
    const rows = batchResults.map((c) => [
      c.id,
      `"${c.input.listing.title.replace(/"/g, '""')}"`,
      `"${c.input.listing.brand.replace(/"/g, '""')}"`,
      c.input.listing.listedPrice,
      c.input.listing.msrpPrice,
      c.input.transaction.paymentMethod,
      c.decision.overallRiskScore,
      c.riskAgent.score,
      c.authenticityAgent.score,
      c.reviewAgent.score,
      c.decision.decision
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trustshield_batch_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered batch results
  const filteredBatchResults = batchResults.filter((c) => {
    if (batchFilterStatus === 'All') return true;
    if (batchFilterStatus === 'Approved') return c.decision.decision === 'Approve';
    if (batchFilterStatus === 'Manual Review') return c.decision.decision === 'Manual Review';
    if (batchFilterStatus === 'Blocked') return c.decision.decision === 'Block';
    return true;
  });

  return (
    <div id="live-evaluator-page" className="space-y-6">
      
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span>Multi-Agent Evaluator Engine</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate individual transactions or upload bulk CSV payloads for multi-agent fraud, authenticity, and review risk assessment.
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setEvalMode('single')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              evalMode === 'single' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Single Item Mode</span>
          </button>

          <button
            onClick={() => setEvalMode('batch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              evalMode === 'batch' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-300" />
            <span>Batch Processing Mode (CSV)</span>
          </button>
        </div>
      </div>

      {/* Triggered High-Risk Email Alert Banner Notice */}
      {triggeredAlertsNotice.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-lg shadow-red-500/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <span>🚨 High-Risk Email Alert Dispatched ({triggeredAlertsNotice.length} Email{triggeredAlertsNotice.length > 1 ? 's' : ''})</span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-red-500/30 text-red-300 font-bold rounded">AUTOMATED SERVICE</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluation crossed your configured threshold rule. Mock alert email sent to <span className="font-mono text-blue-300">{triggeredAlertsNotice[0]?.recipient}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveTab('email_alerts')}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center space-x-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Inspect Email Logs &amp; Thresholds</span>
            </button>
            <button
              onClick={() => setTriggeredAlertsNotice([])}
              className="text-slate-400 hover:text-white p-1 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ================= MODE 1: SINGLE ITEM RUNNER ================= */}
      {evalMode === 'single' && (
        <div className="space-y-6">
          
          {/* Preset Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-slate-900 p-3.5 rounded-2xl border border-slate-800 gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1 shrink-0">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Load Interactive Preset:</span>
            </span>
            <div className="flex items-center space-x-2 overflow-x-auto flex-wrap gap-y-2">
              {SAMPLE_CASES.map((preset, idx) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    selectedPresetIndex === idx && !selectedAmazonProduct
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                  }`}
                >
                  Preset {idx + 1}: {preset.input.listing.brand}
                </button>
              ))}

              {/* Direct In-Site Product Search Trigger */}
              <button
                id="preset-open-search-modal-btn"
                onClick={() => setIsQuickSearchOpen(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center space-x-1.5 shadow ${
                  selectedAmazonProduct
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
                title="Search any Amazon product to load into Evaluator"
              >
                <Search className="w-3.5 h-3.5 text-slate-950" />
                <span>Search Products to Load 🔍</span>
              </button>
            </div>
          </div>

          {/* Quick Amazon Product Search Modal */}
          {isQuickSearchOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Search Amazon Products for Evaluator</h3>
                      <p className="text-[11px] text-slate-400">Type any product name or ASIN to load directly into the 3-Agent Audit Form</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsQuickSearchOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Search Bar Input */}
                <div className="p-4 border-b border-slate-800 bg-slate-900">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      autoFocus
                      value={quickSearchQuery}
                      onChange={(e) => setQuickSearchQuery(e.target.value)}
                      placeholder="Type ANY product (e.g. AirPods, Sony, Rolex, Nike, MacBook, Camera)..."
                      className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-medium"
                    />
                    {quickSearchQuery && (
                      <button
                        onClick={() => setQuickSearchQuery('')}
                        className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white font-mono cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Results List */}
                <div className="p-4 overflow-y-auto space-y-3 flex-1">
                  <div className="text-[11px] text-slate-400 font-semibold px-1 flex items-center justify-between">
                    <span>Found {quickSearchResults.length} matching products</span>
                    <span className="text-amber-400 font-mono">Click 'Load into Evaluator' on any item</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quickSearchResults.map((prod) => (
                      <div
                        key={prod.asin}
                        className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl flex space-x-3 transition-all group"
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          className="w-20 h-20 object-cover rounded-lg bg-slate-900 shrink-0 border border-slate-800"
                        />
                        <div className="flex-1 flex flex-col justify-between space-y-1 min-w-0">
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-amber-400 font-semibold">
                              <span>{prod.brand}</span>
                              <span className="font-mono text-slate-400">ASIN: {prod.asin}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-300 transition-colors">
                              {prod.title}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-amber-400">${prod.amazonPrice.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-400">Rating: ★ {prod.rating}</span>
                          </div>

                          <button
                            onClick={() => loadAmazonProduct(prod)}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer shadow"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Load into Evaluator ⚡</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setIsQuickSearchOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Close Search
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Amazon Product Preset Alert Banner */}
          {selectedAmazonProduct && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Loaded Product from In-Site Amazon Search: <strong className="text-white">{selectedAmazonProduct.title}</strong> ({selectedAmazonProduct.brand}) - <span className="font-mono text-amber-300">ASIN: {selectedAmazonProduct.asin}</span>
                </span>
              </div>
              <button
                onClick={() => handleSelectPreset(0)}
                className="text-amber-400 hover:text-amber-200 underline text-[11px] font-bold cursor-pointer shrink-0 ml-2"
              >
                Reset to Default Preset
              </button>
            </div>
          )}

          {/* Input Form Grid - 3 Columns for 3 Agents */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Agent 1 Input: Transaction & COD Risk */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-white text-sm">Agent 1: Transaction &amp; Risk</h2>
                </div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-bold">40% WEIGHT</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Transaction Amount ($)</label>
                  <input
                    type="number"
                    value={formData.transaction.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction: { ...formData.transaction, amount: parseFloat(e.target.value) || 0 }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Payment Method</label>
                  <select
                    value={formData.transaction.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction: { ...formData.transaction, paymentMethod: e.target.value }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="COD (Cash on Delivery)">COD (Cash on Delivery)</option>
                    <option value="BNPL (Buy Now Pay Later)">BNPL (Buy Now Pay Later)</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Total Past Orders</label>
                    <input
                      type="number"
                      value={formData.transaction.totalPastOrders}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transaction: { ...formData.transaction, totalPastOrders: parseInt(e.target.value) || 0 }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Past Returns Count</label>
                    <input
                      type="number"
                      value={formData.transaction.pastReturnsCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transaction: { ...formData.transaction, pastReturnsCount: parseInt(e.target.value) || 0 }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="font-medium text-white block">VPN / Proxy Detection</span>
                    <span className="text-[10px] text-slate-500">IEEE-CIS Datacenter IP match</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.transaction.isVpnOrProxy}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction: { ...formData.transaction, isVpnOrProxy: e.target.checked }
                      })
                    }
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Agent 2 Input: Listing & Authenticity */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-white text-sm">Agent 2: Authenticity &amp; Listing</h2>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-bold">30% WEIGHT</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-medium">Product Title</label>
                  </div>
                  <input
                    type="text"
                    value={formData.listing.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        listing: { ...formData.listing, title: e.target.value }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Listed Price ($)</label>
                    <input
                      type="number"
                      value={formData.listing.listedPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          listing: { ...formData.listing, listedPrice: parseFloat(e.target.value) || 0 }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">MSRP Price ($)</label>
                    <input
                      type="number"
                      value={formData.listing.msrpPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          listing: { ...formData.listing, msrpPrice: parseFloat(e.target.value) || 0 }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.listing.brand}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        listing: { ...formData.listing, brand: e.target.value }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Product Image URL</label>
                  <input
                    type="text"
                    value={formData.listing.imageUrl || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        listing: { ...formData.listing, imageUrl: e.target.value }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 outline-none truncate"
                  />
                </div>
              </div>
            </div>

            {/* Agent 3 Input: Review Moderation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h2 className="font-bold text-white text-sm">Agent 3: Review Moderation</h2>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">30% WEIGHT</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Review Text</label>
                  <textarea
                    rows={3}
                    value={formData.review.reviewText}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        review: { ...formData.review, reviewText: e.target.value }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Star Rating</label>
                    <select
                      value={formData.review.starRating}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          review: { ...formData.review, starRating: parseInt(e.target.value) || 5 }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    >
                      <option value={5}>5 Stars</option>
                      <option value={4}>4 Stars</option>
                      <option value={3}>3 Stars</option>
                      <option value={2}>2 Stars</option>
                      <option value={1}>1 Star</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Account Age (Days)</label>
                    <input
                      type="number"
                      value={formData.review.reviewerAccountAgeDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          review: { ...formData.review, reviewerAccountAgeDays: parseInt(e.target.value) || 0 }
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="font-medium text-white block">Verified Purchase</span>
                    <span className="text-[10px] text-slate-500">Amazon OpSpam validation</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.review.verifiedPurchase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        review: { ...formData.review, verifiedPurchase: e.target.checked }
                      })
                    }
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Execute Button Bar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Click below to trigger all 3 specialized AI agents in parallel.</span>
            </div>

            <button
              id="execute-eval-btn"
              disabled={isEvaluating}
              onClick={handleExecuteSingle}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Running Agent Mesh...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Multi-Agent Evaluation</span>
                </>
              )}
            </button>
          </div>

          {/* Step-by-Step Sequence Animation */}
          {isEvaluating && (
            <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Multi-Agent Orchestration Sequence</span>
                </h3>
                <span className="text-xs font-mono text-blue-400">Step {evalStep} / 4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className={`p-3 rounded-xl border text-xs ${evalStep >= 1 ? 'bg-blue-950/60 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {evalStep > 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
                    <span>1. Risk Agent</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Cross-checking IEEE-CIS fraud signals...</p>
                </div>

                <div className={`p-3 rounded-xl border text-xs ${evalStep >= 2 ? 'bg-amber-950/60 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {evalStep > 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                    <span>2. Authenticity Agent</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Verifying image logo &amp; MSRP discount...</p>
                </div>

                <div className={`p-3 rounded-xl border text-xs ${evalStep >= 3 ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    {evalStep > 3 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                    <span>3. Review Moderation</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Detecting OpSpam AI review patterns...</p>
                </div>

                <div className={`p-3 rounded-xl border text-xs ${evalStep >= 4 ? 'bg-purple-950/60 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>4. Decision Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Fusing 40/30/30 scores &amp; generating audit log...</p>
                </div>
              </div>
            </div>
          )}

          {/* Single Evaluation Result */}
          {evalResult && !isEvaluating && (
            <div id="evaluation-result-box" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                    <span>Evaluation Complete</span>
                    <span>•</span>
                    <span className="text-blue-400 font-bold">{evalResult.id}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1">Multi-Agent Trust &amp; Safety Decision</h2>
                </div>

                <div>
                  {evalResult.decision.decision === 'Block' && (
                    <div className="flex items-center space-x-2 px-5 py-2.5 bg-red-500/20 border-2 border-red-500 text-red-400 font-extrabold text-sm rounded-xl shadow-lg shadow-red-500/20 uppercase tracking-wide">
                      <Ban className="w-5 h-5" />
                      <span>DECISION: BLOCK TRANSACTION</span>
                    </div>
                  )}
                  {evalResult.decision.decision === 'Manual Review' && (
                    <div className="flex items-center space-x-2 px-5 py-2.5 bg-amber-500/20 border-2 border-amber-500 text-amber-400 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 uppercase tracking-wide">
                      <AlertTriangle className="w-5 h-5" />
                      <span>DECISION: MANUAL REVIEW</span>
                    </div>
                  )}
                  {evalResult.decision.decision === 'Approve' && (
                    <div className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 uppercase tracking-wide">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>DECISION: AUTO-APPROVED</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Overall Score Box */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Overall Risk Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-black text-white tracking-tight">{evalResult.decision.overallRiskScore}</span>
                      <span className="text-sm font-semibold text-slate-500">/ 100</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed max-w-xl bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="font-bold text-white block mb-0.5">Decision Engine Reasoning:</span>
                    {evalResult.decision.summaryReasoning}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ================= MODE 2: BATCH PROCESSING MODE (CSV) ================= */}
      {evalMode === 'batch' && (
        <div className="space-y-6">
          
          {/* Top Info Banner */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 mt-0.5">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Bulk Multi-Agent CSV Processing</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                      Simultaneous Agent Mesh
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Upload or paste a CSV file containing multiple e-commerce listings, transactions, and reviews. Agent 1 (IEEE-CIS Fraud), Agent 2 (Computer Vision &amp; Counterfeit MSRP), and Agent 3 (OpSpam Review Moderation) will execute bulk analysis across all rows simultaneously.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleDownloadSampleCsv}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download Sample CSV</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload CSV File</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* CSV Input & Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: CSV Raw Text Editor (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" /> Raw CSV Text Input
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {parsedItems.length} Rows Parsed
                </span>
              </div>

              <textarea
                rows={12}
                value={rawCsvText}
                onChange={(e) => handleCsvTextChange(e.target.value)}
                placeholder="Paste CSV rows here..."
                className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:border-indigo-500 outline-none leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Columns: Title, Brand, Listed Price, MSRP, Payment, Amount, VPN, Returns, Velocity, Review, Verified</span>
                <button
                  onClick={() => handleCsvTextChange(SAMPLE_BATCH_CSV)}
                  className="text-indigo-400 hover:underline font-semibold"
                >
                  Reset Sample
                </button>
              </div>
            </div>

            {/* Right: Parsed CSV Rows Table & Execution Trigger (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-400" /> Batch Preview ({parsedItems.length} Valid Items)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Ready for Multi-Agent Analysis
                  </span>
                </div>

                {/* Table Preview */}
                <div className="mt-3 overflow-x-auto max-h-[300px] overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-2.5 font-mono">#</th>
                        <th className="p-2.5">Product Title</th>
                        <th className="p-2.5">Brand</th>
                        <th className="p-2.5 font-mono">Price / MSRP</th>
                        <th className="p-2.5">Payment</th>
                        <th className="p-2.5">VPN / Proxy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                      {parsedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-mono text-slate-500 font-bold">{idx + 1}</td>
                          <td className="p-2.5 font-semibold text-white max-w-[160px] truncate">{item.listing.title}</td>
                          <td className="p-2.5 text-slate-400">{item.listing.brand}</td>
                          <td className="p-2.5 font-mono">
                            ${item.listing.listedPrice} <span className="text-slate-500">/ ${item.listing.msrpPrice}</span>
                          </td>
                          <td className="p-2.5 text-slate-300">{item.transaction.paymentMethod}</td>
                          <td className="p-2.5">
                            {item.transaction.isVpnOrProxy ? (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded">VPN</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">Clean</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Execution Bar */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {parsedItems.length} items will be processed across Agent 1, Agent 2, &amp; Agent 3.
                </span>

                <button
                  disabled={isBatchRunning || parsedItems.length === 0}
                  onClick={handleExecuteBatch}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isBatchRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing Batch ({batchProgressIndex}/{parsedItems.length})...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Run Bulk Multi-Agent Analysis</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* Batch Running Progress Bar */}
          {isBatchRunning && (
            <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Processing Batch Payload ({batchProgressIndex} of {parsedItems.length} Items Complete)</span>
                </span>
                <span className="font-mono text-indigo-400 font-bold">
                  {Math.round((batchProgressIndex / parsedItems.length) * 100)}%
                </span>
              </div>

              {/* Bar */}
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  style={{ width: `${(batchProgressIndex / parsedItems.length) * 100}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-300"
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Agent 1 (IEEE-CIS) + Agent 2 (Vision Counterfeit) + Agent 3 (OpSpam Reviews)</span>
                <span>Executing Parallel Fusion Engine</span>
              </div>
            </div>
          )}

          {/* BATCH RESULTS DASHBOARD */}
          {batchResults.length > 0 && !isBatchRunning && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              
              {/* Results Summary Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Batch Multi-Agent Analysis Complete</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluated {batchResults.length} items. Automated decisions applied based on 40/30/30 weighted agent fusion policy.
                  </p>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportBatchResultsCsv}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Export Results (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Batch KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-medium">Total Items Evaluated</span>
                  <div className="text-2xl font-bold font-mono text-white">{batchResults.length}</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-1">
                  <span className="text-emerald-400 font-medium">Auto-Approved</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {batchResults.filter((c) => c.decision.decision === 'Approve').length}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-1">
                  <span className="text-amber-400 font-medium">Manual Review Hold</span>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {batchResults.filter((c) => c.decision.decision === 'Manual Review').length}
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-red-500/30 space-y-1">
                  <span className="text-red-400 font-medium">Blocked Fraud Items</span>
                  <div className="text-2xl font-bold font-mono text-red-400">
                    {batchResults.filter((c) => c.decision.decision === 'Block').length}
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Results:</span>
                {['All', 'Approved', 'Manual Review', 'Blocked'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBatchFilterStatus(st)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      batchFilterStatus === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st} ({
                      st === 'All' ? batchResults.length : batchResults.filter((c) => {
                        if (st === 'Approved') return c.decision.decision === 'Approve';
                        if (st === 'Manual Review') return c.decision.decision === 'Manual Review';
                        if (st === 'Blocked') return c.decision.decision === 'Block';
                        return true;
                      }).length
                    })
                  </button>
                ))}
              </div>

              {/* Batch Results Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-3 font-mono">Case ID</th>
                      <th className="p-3">Product Title &amp; Brand</th>
                      <th className="p-3">Payment &amp; VPN</th>
                      <th className="p-3 text-center font-mono">Risk (A1)</th>
                      <th className="p-3 text-center font-mono">Auth (A2)</th>
                      <th className="p-3 text-center font-mono">Review (A3)</th>
                      <th className="p-3 text-center font-mono">Score</th>
                      <th className="p-3">Decision</th>
                      <th className="p-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredBatchResults.map((caseItem) => (
                      <tr key={caseItem.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-blue-400">{caseItem.id}</td>
                        <td className="p-3">
                          <div className="font-bold text-white max-w-[200px] truncate">{caseItem.input.listing.title}</div>
                          <div className="text-[10px] text-slate-400">{caseItem.input.listing.brand}</div>
                        </td>
                        <td className="p-3">
                          <div>${caseItem.input.transaction.amount.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-500">
                            {caseItem.input.transaction.paymentMethod} {caseItem.input.transaction.isVpnOrProxy ? '(VPN)' : ''}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-blue-400">{caseItem.riskAgent.score}</td>
                        <td className="p-3 text-center font-mono font-bold text-amber-400">{caseItem.authenticityAgent.score}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-400">{caseItem.reviewAgent.score}</td>
                        <td className="p-3 text-center font-mono font-extrabold text-white text-sm">
                          {caseItem.decision.overallRiskScore}
                        </td>
                        <td className="p-3">
                          {caseItem.decision.decision === 'Block' && (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                              Blocked
                            </span>
                          )}
                          {caseItem.decision.decision === 'Manual Review' && (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Manual Review
                            </span>
                          )}
                          {caseItem.decision.decision === 'Approve' && (
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Approved
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setInspectModalCase(caseItem)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ================= RECENT EVALUATIONS HISTORY (LOCAL STORAGE) ================= */}
      <div id="recent-evaluations-history" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Evaluations History</h2>
              <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                {historyCases.length} Persisted in LocalStorage
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Previous evaluation results saved locally in your browser session. Revisit previous analyses, view multi-agent breakdowns, or reload parameters.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {historyCases.length > 0 ? (
              <>
                <button
                  onClick={handleExportHistoryCsv}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-slate-700"
                  title="Export history to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleClearHistory}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-red-500/20"
                  title="Clear all local storage history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleLoadSampleHistory}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Load Sample Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls */}
        {historyCases.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history by title, brand, case ID, decision..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              {['All', 'Approved', 'Manual Review', 'Blocked'].map((st) => {
                const count = historyCases.filter((c) => {
                  if (st === 'All') return true;
                  if (st === 'Approved') return c.decision.decision === 'Approve';
                  if (st === 'Manual Review') return c.decision.decision === 'Manual Review';
                  if (st === 'Blocked') return c.decision.decision === 'Block';
                  return true;
                }).length;

                return (
                  <button
                    key={st}
                    onClick={() => setHistoryFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      historyFilterStatus === st
                        ? 'bg-indigo-600 text-white font-bold shadow'
                        : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {st} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* History Table or Empty States */}
        {historyCases.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No Recent Evaluation History</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Evaluations you execute will automatically be saved to your browser's local storage so you can review them at any time.
            </p>
            <button
              onClick={handleLoadSampleHistory}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Populate Sample History into Local Storage
            </button>
          </div>
        ) : filteredHistoryCases.length === 0 ? (
          <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">No history items match your search "{historySearch}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3 font-mono">Case ID &amp; Time</th>
                  <th className="p-3">Product Title &amp; Brand</th>
                  <th className="p-3">Amount &amp; Method</th>
                  <th className="p-3 text-center font-mono">A1 (Risk)</th>
                  <th className="p-3 text-center font-mono">A2 (Auth)</th>
                  <th className="p-3 text-center font-mono">A3 (Review)</th>
                  <th className="p-3 text-center font-mono">Overall</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredHistoryCases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-bold text-blue-400">{c.id}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString() + ' ' + new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Recently'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white max-w-[180px] truncate">{c.input.listing.title}</div>
                      <div className="text-[10px] text-slate-400">{c.input.listing.brand}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-mono font-semibold">${c.input.transaction.amount.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-500">
                        {c.input.transaction.paymentMethod} {c.input.transaction.isVpnOrProxy ? '(VPN)' : ''}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-blue-400">{c.riskAgent.score}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-400">{c.authenticityAgent.score}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-400">{c.reviewAgent.score}</td>
                    <td className="p-3 text-center font-mono font-extrabold text-white text-sm">
                      {c.decision.overallRiskScore}
                    </td>
                    <td className="p-3">
                      {c.decision.decision === 'Block' && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Blocked
                        </span>
                      )}
                      {c.decision.decision === 'Manual Review' && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Manual Review
                        </span>
                      )}
                      {c.decision.decision === 'Approve' && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Approved
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setInspectModalCase(c)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                          title="Inspect case details"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={() => handleReloadIntoEvaluator(c)}
                          className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[11px] font-semibold rounded-lg border border-indigo-500/30 transition-all cursor-pointer"
                          title="Reload parameters into evaluator"
                        >
                          Reload
                        </button>
                        <button
                          onClick={(e) => handleRemoveFromHistory(c.id, e)}
                          className="p-1 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                          title="Remove from local history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* INSPECTOR MODAL FOR BATCH CASE DETAILS */}
      {inspectModalCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono font-bold text-blue-400 text-xs">{inspectModalCase.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{inspectModalCase.input.listing.title}</h3>
              </div>
              <button
                onClick={() => setInspectModalCase(null)}
                className="text-slate-400 hover:text-white text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Decision Banner */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Overall Risk Score</span>
                <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                  {inspectModalCase.decision.overallRiskScore} / 100
                </div>
              </div>

              <div>
                {inspectModalCase.decision.decision === 'Block' && (
                  <span className="px-3 py-1.5 rounded-lg font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    Decision: Block
                  </span>
                )}
                {inspectModalCase.decision.decision === 'Manual Review' && (
                  <span className="px-3 py-1.5 rounded-lg font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Decision: Manual Review
                  </span>
                )}
                {inspectModalCase.decision.decision === 'Approve' && (
                  <span className="px-3 py-1.5 rounded-lg font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Decision: Approve
                  </span>
                )}
              </div>
            </div>

            {/* 3 Agent Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/30 space-y-2">
                <div className="flex justify-between items-center text-blue-400 font-bold">
                  <span>Agent 1: Risk</span>
                  <span className="font-mono text-white">{inspectModalCase.riskAgent.score}/100</span>
                </div>
                <p className="text-[11px] text-slate-300">{inspectModalCase.riskAgent.explanation}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex justify-between items-center text-amber-400 font-bold">
                  <span>Agent 2: Auth</span>
                  <span className="font-mono text-white">{inspectModalCase.authenticityAgent.score}/100</span>
                </div>
                <p className="text-[11px] text-slate-300">{inspectModalCase.authenticityAgent.explanation}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex justify-between items-center text-emerald-400 font-bold">
                  <span>Agent 3: Review</span>
                  <span className="font-mono text-white">{inspectModalCase.reviewAgent.score}/100</span>
                </div>
                <p className="text-[11px] text-slate-300">{inspectModalCase.reviewAgent.explanation}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedCase(inspectModalCase);
                  setInspectModalCase(null);
                  setActiveTab('decision_engine');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Open in Audit Vault &amp; Human Governance
              </button>

              <button
                onClick={() => setInspectModalCase(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
