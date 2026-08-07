import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Send,
  RefreshCw,
  Search,
  Eye,
  ExternalLink,
  Settings,
  Server,
  Zap,
  Clock,
  Filter,
  Check,
  AlertTriangle,
  Download
} from 'lucide-react';
import { EmailAlertConfig, MockEmailAlert, FinalDecision } from '../types';
import {
  fetchAlertConfig,
  updateAlertConfig,
  fetchAlertHistory,
  clearAlertHistory,
  sendTestAlert
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export const EmailAlertsManager: React.FC = () => {
  const { setActiveTab, setSelectedCase, cases } = useAuth();

  const [config, setConfig] = useState<EmailAlertConfig | null>(null);
  const [history, setHistory] = useState<MockEmailAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // New recipient input state
  const [newRecipient, setNewRecipient] = useState<string>('');
  const [recipientError, setRecipientError] = useState<string>('');

  // Search & Filter for Email Inbox
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDecision, setFilterDecision] = useState<string>('All');

  // Preview Modal
  const [selectedAlertForPreview, setSelectedAlertForPreview] = useState<MockEmailAlert | null>(null);

  // Status message
  const [testAlertMessage, setTestAlertMessage] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cfgRes, histRes] = await Promise.all([
        fetchAlertConfig(),
        fetchAlertHistory()
      ]);
      setConfig(cfgRes.config);
      setHistory(histRes.alerts);
    } catch (err) {
      console.error('Error loading email alert data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleEnabled = () => {
    if (!config) return;
    setConfig({ ...config, enabled: !config.enabled });
  };

  const handleRiskScoreChange = (score: number) => {
    if (!config) return;
    setConfig({ ...config, riskScoreThreshold: score });
  };

  const handleMinAmountChange = (amount: number) => {
    if (!config) return;
    setConfig({ ...config, minAmountThreshold: amount });
  };

  const handleToggleDecisionRule = (decision: FinalDecision) => {
    if (!config) return;
    const current = [...config.notifyOnDecision];
    if (current.includes(decision)) {
      if (current.length === 1) return; // keep at least 1
      setConfig({ ...config, notifyOnDecision: current.filter((d) => d !== decision) });
    } else {
      setConfig({ ...config, notifyOnDecision: [...current, decision] });
    }
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    setRecipientError('');
    if (!newRecipient.trim()) return;
    if (!newRecipient.includes('@') || !newRecipient.includes('.')) {
      setRecipientError('Please enter a valid email address.');
      return;
    }
    if (!config) return;
    if (config.recipientEmails.includes(newRecipient.trim())) {
      setRecipientError('This email is already in the recipient list.');
      return;
    }

    setConfig({
      ...config,
      recipientEmails: [...config.recipientEmails, newRecipient.trim()]
    });
    setNewRecipient('');
  };

  const handleRemoveRecipient = (email: string) => {
    if (!config) return;
    if (config.recipientEmails.length <= 1) {
      alert('Must maintain at least one recipient email.');
      return;
    }
    setConfig({
      ...config,
      recipientEmails: config.recipientEmails.filter((e) => e !== email)
    });
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await updateAlertConfig(config);
      setConfig(res.config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save alert config:', err);
      alert('Error saving alert configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestAlert = async () => {
    setIsSendingTest(true);
    setTestAlertMessage(null);
    try {
      const res = await sendTestAlert();
      setTestAlertMessage(res.message);
      // Reload history
      const histRes = await fetchAlertHistory();
      setHistory(histRes.alerts);
      if (histRes.alerts.length > 0) {
        setSelectedAlertForPreview(histRes.alerts[0]);
      }
      setTimeout(() => setTestAlertMessage(null), 5000);
    } catch (err) {
      console.error('Failed to send test alert:', err);
      alert('Error dispatching test alert.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all mock email alert history logs?')) {
      try {
        await clearAlertHistory();
        setHistory([]);
      } catch (err) {
        console.error('Failed to clear alert history:', err);
      }
    }
  };

  const handleInspectCase = (caseId: string) => {
    const found = cases.find((c) => c.id === caseId);
    if (found) {
      setSelectedCase(found);
      setActiveTab('decision_engine');
    } else {
      setActiveTab('decision_engine');
    }
  };

  const handleExportCsv = () => {
    if (history.length === 0) return;
    const headers = ['Alert ID', 'Timestamp', 'Recipient', 'Subject', 'Case ID', 'Risk Score', 'Decision', 'Amount', 'Status'];
    const rows = history.map((a) => [
      a.id,
      `"${a.timestamp}"`,
      `"${a.recipient}"`,
      `"${a.subject.replace(/"/g, '""')}"`,
      a.caseId,
      a.riskScore,
      a.decision,
      a.transactionAmount,
      a.status
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'trustshield_email_alerts_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter History
  const filteredHistory = history.filter((alert) => {
    if (filterDecision !== 'All') {
      if (filterDecision === 'Block' && alert.decision !== 'Block') return false;
      if (filterDecision === 'Manual Review' && alert.decision !== 'Manual Review') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        alert.id.toLowerCase().includes(q) ||
        alert.caseId.toLowerCase().includes(q) ||
        alert.subject.toLowerCase().includes(q) ||
        alert.recipient.toLowerCase().includes(q) ||
        alert.brand.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 space-x-3">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-sm font-medium">Loading Email Alert Threshold Service...</span>
      </div>
    );
  }

  return (
    <div id="email-alerts-manager-page" className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                High-Risk Email Alerts &amp; Notification Thresholds
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${
                config.enabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {config.enabled ? 'SERVICE ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Service layer that triggers mock email alerts whenever evaluated transactions exceed specified risk thresholds or match policy rules.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleSendTestAlert}
              disabled={isSendingTest}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 text-blue-400 ${isSendingTest ? 'animate-bounce' : ''}`} />
              <span>{isSendingTest ? 'Sending...' : 'Send Test Alert'}</span>
            </button>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Config Saved!</span>
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Thresholds'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {testAlertMessage && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testAlertMessage}</span>
            </div>
            <button
              onClick={() => setSelectedAlertForPreview(history[0] || null)}
              className="text-xs text-blue-400 underline hover:text-blue-300 font-semibold"
            >
              View Generated Email
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Config Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Threshold & Policy Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Master Toggle & Threshold Sliders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Notification Threshold Rules
                </h2>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={handleToggleEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  config.enabled ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Risk Score Threshold Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
                  <span>Overall Risk Score Alert Threshold:</span>
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                    config.riskScoreThreshold >= 70
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : config.riskScoreThreshold >= 41
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    ≥ {config.riskScoreThreshold} / 100
                  </span>
                </label>
                <span className="text-[11px] text-slate-500">Default: 70</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={config.riskScoreThreshold}
                onChange={(e) => handleRiskScoreChange(Number(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 (Alert All)</span>
                <span className="text-emerald-400">Low (&le;40)</span>
                <span className="text-amber-400">Manual Review (41-70)</span>
                <span className="text-red-400">High Risk (&ge;71)</span>
                <span>100 (Critical)</span>
              </div>
            </div>

            {/* Minimum Transaction Amount Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Minimum Transaction Amount ($)
                </label>
                <span className="text-[11px] text-slate-500">0 = No minimum</span>
              </div>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-2 text-slate-500 text-xs">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={config.minAmountThreshold}
                  onChange={(e) => handleMinAmountChange(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. 500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Only trigger mock email alerts if transaction amount is equal to or exceeds this value.
              </p>
            </div>

            {/* Decision Rule Triggers */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-300 block">
                Trigger Alerts for Final Decisions:
              </label>
              <div className="flex flex-wrap gap-3">
                {(['Block', 'Manual Review', 'Approve'] as FinalDecision[]).map((dec) => {
                  const isChecked = config.notifyOnDecision.includes(dec);
                  return (
                    <button
                      key={dec}
                      type="button"
                      onClick={() => handleToggleDecisionRule(dec)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        isChecked
                          ? dec === 'Block'
                            ? 'bg-red-500/20 text-red-300 border-red-500/40 font-bold'
                            : dec === 'Manual Review'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                          : 'bg-slate-950 text-slate-500 border-slate-800'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        isChecked ? 'bg-current border-transparent' : 'border-slate-600'
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                      </div>
                      <span>{dec}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Recipient Email Addresses Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Notification Recipient List
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {config.recipientEmails.length} Registered
              </span>
            </div>

            {/* List of active recipients */}
            <div className="flex flex-wrap gap-2">
              {config.recipientEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{email}</span>
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                    title="Remove recipient"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add recipient form */}
            <form onSubmit={handleAddRecipient} className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Add analyst or team email (e.g. analyst@trustshield.ai)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Email</span>
                </button>
              </div>
              {recipientError && (
                <p className="text-xs text-red-400">{recipientError}</p>
              )}
            </form>
          </div>

        </div>

        {/* Right Column: Mock Gateway & Server Config (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SMTP & Webhook Credentials Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Server className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Mock Gateway &amp; Webhook Credentials
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Sender Email Address:</label>
                <input
                  type="text"
                  value={config.smtpServerMock.senderAddress}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      smtpServerMock: { ...config.smtpServerMock, senderAddress: e.target.value }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-slate-200 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Mock SMTP Host:</label>
                  <input
                    type="text"
                    value={config.smtpServerMock.host}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        smtpServerMock: { ...config.smtpServerMock, host: e.target.value }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Port:</label>
                  <input
                    type="number"
                    value={config.smtpServerMock.port}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        smtpServerMock: { ...config.smtpServerMock, port: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-slate-200 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Mock Webhook Endpoint (Slack/PagerDuty):</label>
                <input
                  type="text"
                  value={config.webhookUrl || ''}
                  onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-slate-300 focus:border-blue-500 outline-none text-[11px]"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-semibold">
                <Zap className="w-3.5 h-3.5" />
                <span>Service Layer Logic</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When an evaluation completes, <code className="text-blue-300 font-mono">processEmailAlertsForCase()</code> verifies if overall risk score or decision matches your thresholds. Triggered alert emails are automatically logged to the history below and dispatched to configured recipients.
              </p>
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Notification Dispatch Stats
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xl font-extrabold text-white font-mono">{history.length}</div>
                <div className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">Alerts Dispatched</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xl font-extrabold text-red-400 font-mono">
                  {history.filter((a) => a.decision === 'Block').length}
                </div>
                <div className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">High Risk Blocks</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Triggered Alert Email History Inbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        
        {/* Inbox Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Dispatched Alert Email Logs ({history.length})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Audit log of mock email notifications dispatched by the service layer. Click preview to inspect rendered HTML email.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {history.length > 0 && (
              <>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleClearHistory}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all cursor-pointer border border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        {history.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search alert logs by case ID, subject, recipient, brand..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto">
              {['All', 'Block', 'Manual Review'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterDecision(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    filterDecision === st
                      ? 'bg-blue-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Email Logs Table */}
        {history.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <Mail className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No Email Alerts Triggered Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Run evaluations in the Live Evaluator or click "Send Test Alert" above to generate and inspect mock email notifications.
            </p>
            <button
              onClick={handleSendTestAlert}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Dispatch Sample Test Alert Email
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">No alert logs match search "{searchQuery}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="p-3 font-mono">Alert ID &amp; Time</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Subject / Trigger Reason</th>
                  <th className="p-3">Case ID</th>
                  <th className="p-3 text-center font-mono">Risk Score</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredHistory.map((alertItem) => (
                  <tr key={alertItem.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-3">
                      <div className="font-mono font-bold text-blue-400">{alertItem.id}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(alertItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-200">
                      {alertItem.recipient}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white max-w-[260px] truncate">{alertItem.subject}</div>
                      <div className="text-[10px] text-slate-400 max-w-[260px] truncate">{alertItem.triggerReason}</div>
                    </td>
                    <td className="p-3 font-mono text-blue-300 font-semibold">
                      {alertItem.caseId}
                    </td>
                    <td className="p-3 text-center font-mono font-extrabold text-white text-sm">
                      <span className={`px-2 py-0.5 rounded ${
                        alertItem.riskScore >= 70
                          ? 'text-red-400 bg-red-500/10'
                          : 'text-amber-400 bg-amber-500/10'
                      }`}>
                        {alertItem.riskScore}
                      </span>
                    </td>
                    <td className="p-3">
                      {alertItem.decision === 'Block' && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Block
                        </span>
                      )}
                      {alertItem.decision === 'Manual Review' && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Manual Review
                        </span>
                      )}
                      {alertItem.decision === 'Approve' && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Approve
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedAlertForPreview(alertItem)}
                          className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[11px] font-semibold rounded-lg border border-blue-500/30 transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview Email</span>
                        </button>

                        <button
                          onClick={() => handleInspectCase(alertItem.caseId)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                          title="Inspect case in Decision Audit Vault"
                        >
                          <ExternalLink className="w-3 h-3" />
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

      {/* REALISTIC HTML EMAIL PREVIEW MODAL */}
      {selectedAlertForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl animate-scale-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  Rendered Email HTML Preview
                </h3>
              </div>
              <button
                onClick={() => setSelectedAlertForPreview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Email Meta Bar */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
              <div className="text-slate-300"><strong className="text-slate-500">From:</strong> {config.smtpServerMock.senderAddress}</div>
              <div className="text-slate-300"><strong className="text-slate-500">To:</strong> {selectedAlertForPreview.recipient}</div>
              <div className="text-slate-300"><strong className="text-slate-500">Subject:</strong> {selectedAlertForPreview.subject}</div>
              <div className="text-slate-300"><strong className="text-slate-500">Timestamp:</strong> {new Date(selectedAlertForPreview.timestamp).toLocaleString()}</div>
            </div>

            {/* Rendered Email Body Box */}
            <div
              className="p-4 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: selectedAlertForPreview.bodyHtml }}
            />

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleInspectCase(selectedAlertForPreview.caseId)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center space-x-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Case {selectedAlertForPreview.caseId} in Audit Vault</span>
              </button>

              <button
                onClick={() => setSelectedAlertForPreview(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
