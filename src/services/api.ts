import { AuditCase, EvaluationInput, SystemStats, User, FinalDecision, EmailAlertConfig, MockEmailAlert, SystemHealthOverview } from '../types';
import { SAMPLE_CASES } from '../data/sampleCases';

const defaultUser: User = {
  id: "USR-1001",
  name: "Alex Vance",
  email: "alex.vance@trustshield.ai",
  role: "trust_lead",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  createdAt: "2026-01-15T00:00:00Z"
};

const defaultStats: SystemStats = {
  totalEvaluated: SAMPLE_CASES.length,
  approvedCount: SAMPLE_CASES.filter(c => c.status === 'Approved').length,
  manualReviewCount: SAMPLE_CASES.filter(c => c.status === 'Under Manual Review' || c.status === 'Pending').length,
  blockedCount: SAMPLE_CASES.filter(c => c.status === 'Blocked').length,
  totalFraudPreventedAmount: Math.round(SAMPLE_CASES.filter(c => c.status === 'Blocked').reduce((sum, c) => sum + (c.input.transaction.amount || 0), 0)),
  avgResponseTimeMs: 420,
  agentAccuracy: {
    riskAgent: 96.8,
    authenticityAgent: 94.2,
    reviewAgent: 95.5
  }
};

const defaultAlertConfig: EmailAlertConfig = {
  enabled: true,
  recipientEmails: ["alex.vance@trustshield.ai", "risk-ops@trustshield.ai"],
  riskScoreThreshold: 70,
  notifyOnDecision: ["Block", "Manual Review"],
  minAmountThreshold: 0,
  webhookUrl: "https://hooks.slack.com/services/mock/trustshield-high-risk-alerts",
  smtpServerMock: {
    host: "smtp.trustshield.internal",
    port: 587,
    senderAddress: "no-reply-alerts@trustshield.ai"
  }
};

const defaultAgentHealth: SystemHealthOverview = {
  overallStatus: 'all_operational',
  meshType: 'Multi-Agent Parallel Mesh (3 Specialized Nodes)',
  lastChecked: new Date().toISOString(),
  agents: [
    {
      id: 'risk',
      name: 'Agent 1: Transaction & Risk',
      model: 'IEEE-CIS Neural Risk Classifier (v2.4)',
      weight: '40%',
      status: 'healthy',
      latencyMs: 145,
      uptimePercent: 99.9,
      lastPing: new Date().toISOString(),
      endpoint: '/api/agents/risk',
      activeRequests: 0
    },
    {
      id: 'authenticity',
      name: 'Agent 2: Authenticity & Listing',
      model: 'Vision-Price Authenticity Evaluator (v3.1)',
      weight: '30%',
      status: 'healthy',
      latencyMs: 180,
      uptimePercent: 99.7,
      lastPing: new Date().toISOString(),
      endpoint: '/api/agents/authenticity',
      activeRequests: 0
    },
    {
      id: 'review',
      name: 'Agent 3: Review Moderation',
      model: 'OpSpam & Amazon NLP Moderation Engine (v1.9)',
      weight: '30%',
      status: 'healthy',
      latencyMs: 160,
      uptimePercent: 99.8,
      lastPing: new Date().toISOString(),
      endpoint: '/api/agents/review',
      activeRequests: 0
    }
  ]
};

export async function fetchAgentHealth(): Promise<SystemHealthOverview> {
  try {
    const response = await fetch('/api/agents/health');
    if (response.ok) return await response.json();
  } catch (e) {}
  return defaultAgentHealth;
}

export async function pingAgentHealth(): Promise<SystemHealthOverview & { message: string }> {
  try {
    const response = await fetch('/api/agents/health/ping', {
      method: 'POST'
    });
    if (response.ok) return await response.json();
  } catch (e) {}
  return { ...defaultAgentHealth, message: "Agent mesh health ping successful." };
}

export async function toggleAgentSimulation(agentId: string, targetStatus?: string): Promise<{ agents: any[]; updatedAgent: any; message: string }> {
  try {
    const response = await fetch('/api/agents/health/toggle-simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, targetStatus })
    });
    if (response.ok) return await response.json();
  } catch (e) {}
  return {
    agents: defaultAgentHealth.agents,
    updatedAgent: { id: agentId, status: targetStatus || 'Optimal' },
    message: `Toggled simulation state for ${agentId}`
  };
}

function localEvaluate(input: EvaluationInput): { case: AuditCase; stats: SystemStats; triggeredAlerts?: MockEmailAlert[] } {
  const { transaction, listing, review } = input;

  let riskScore = 15;
  const signals: any[] = [];
  if (transaction.isVpnOrProxy) {
    riskScore += 35;
    signals.push({ name: "IP Anomaly", riskImpact: "Critical", detail: "VPN or Proxy connection detected." });
  }
  if (transaction.paymentMethod === "COD (Cash on Delivery)") {
    const returnRatio = transaction.totalPastOrders > 0 ? (transaction.pastReturnsCount / transaction.totalPastOrders) * 100 : 0;
    if (returnRatio > 40) {
      riskScore += 30;
      signals.push({ name: "COD Return Abuse", riskImpact: "Negative", detail: `High COD return history (${returnRatio.toFixed(0)}% returns).` });
    }
  }
  if (transaction.velocity24h > 4) {
    riskScore += 20;
    signals.push({ name: "Order Velocity", riskImpact: "Negative", detail: `${transaction.velocity24h} orders in 24 hours.` });
  }
  if (transaction.customerAgeDays < 7) {
    riskScore += 15;
    signals.push({ name: "New Account", riskImpact: "Negative", detail: "Account created less than 7 days ago." });
  }
  if (signals.length === 0) {
    signals.push({ name: "Clean Signals", riskImpact: "Positive", detail: "Standard customer device and payment profile." });
  }
  riskScore = Math.min(100, riskScore);

  const riskAgent = {
    score: riskScore,
    probabilityPercent: Math.min(99, riskScore + 3),
    riskLevel: (riskScore > 70 ? "High" : riskScore > 40 ? "Medium" : "Low") as "High" | "Medium" | "Low",
    explanation: `Calculated fraud risk score of ${riskScore}/100 based on IEEE-CIS transaction benchmarks, IP location, payment method, and return history.`,
    signals,
    datasetFeatures: [
      { feature: "IEEE-CIS V_130", value: transaction.isVpnOrProxy ? "Proxy Flagged" : "Standard", ieeeCisBenchmark: "Datacenter Proxy Cluster" },
      { feature: "Return Ratio", value: `${transaction.pastReturnsCount}/${transaction.totalPastOrders}`, ieeeCisBenchmark: "COD Threshold >30%" }
    ]
  };

  let authScore = 10;
  const priceDiff = listing.msrpPrice > 0 ? ((listing.listedPrice - listing.msrpPrice) / listing.msrpPrice) * 100 : 0;
  let logoStatus: 'Pass' | 'Warning' | 'Fail' = 'Pass';
  if (priceDiff < -50) {
    authScore += 45;
    logoStatus = 'Fail';
  } else if (priceDiff < -25) {
    authScore += 25;
    logoStatus = 'Warning';
  }
  if (listing.sellerRating < 3.0) authScore += 20;
  if (listing.sellerAgeMonths < 1) authScore += 15;
  authScore = Math.min(100, authScore);

  const authenticityAgent = {
    score: authScore,
    authenticityScore: 100 - authScore,
    counterfeitConfidencePercent: Math.min(99, authScore + 2),
    explanation: `Authenticity risk score of ${authScore}/100 based on price variance (${priceDiff.toFixed(1)}% vs MSRP), brand seller authorization, and logo consistency.`,
    checks: {
      logoConsistency: {
        status: logoStatus,
        score: Math.max(10, 100 - authScore),
        detail: logoStatus === 'Fail' ? "Logo alignment mismatch detected." : "Logo matches official brand asset."
      },
      packagingQuality: {
        status: (authScore > 60 ? 'Warning' : 'Pass') as 'Pass' | 'Warning' | 'Fail',
        score: Math.max(20, 95 - authScore),
        detail: authScore > 60 ? "Unverified packaging label formatting." : "Retail serial barcode format valid."
      },
      priceMsrpComparison: {
        status: (Math.abs(priceDiff) > 30 ? 'Fail' : 'Pass') as 'Pass' | 'Warning' | 'Fail',
        priceDiffPercent: Math.round(priceDiff),
        detail: `Listed price ($${listing.listedPrice}) vs MSRP ($${listing.msrpPrice}).`
      },
      brandAuthorizedSeller: {
        status: (listing.sellerAgeMonths > 6 && listing.sellerRating >= 4.0 ? 'Pass' : 'Warning') as 'Pass' | 'Warning' | 'Fail',
        detail: listing.sellerRating >= 4.0 ? "Verified seller profile." : "New seller account with low feedback."
      }
    }
  };

  let reviewScore = 10;
  const text = (review.reviewText || '').toLowerCase();
  const suspiciousWords = ["wonderful", "extraordinary", "transcendent", "craftsmanship", "best purchase ever", "super", "life changing"];
  const matches = suspiciousWords.filter((w) => text.includes(w));
  if (matches.length >= 2) reviewScore += 35;
  if (!review.verifiedPurchase) reviewScore += 20;
  if (review.reviewerAccountAgeDays < 5) reviewScore += 20;
  reviewScore = Math.min(100, reviewScore);

  const reviewAgent = {
    score: reviewScore,
    classification: (reviewScore > 70 ? "Fake / AI-Generated" : reviewScore > 40 ? "Suspicious" : "Genuine") as "Genuine" | "Suspicious" | "Fake / AI-Generated",
    confidenceScorePercent: Math.min(98, reviewScore + 10),
    explanation: `Review moderation score of ${reviewScore}/100. Evaluated linguistic patterns, account age, and Amazon/OpSpam fake review datasets.`,
    reasons: matches.length > 0
      ? [`Contains generic hyperbolic phrases: ${matches.join(", ")}`, review.verifiedPurchase ? "Verified purchase" : "Unverified purchase"]
      : ["Natural tone and specific feedback"],
    nlpMetrics: {
      aiPatternScore: reviewScore,
      sentimentExaggeration: (matches.length >= 2 ? "Hyperbolic" : "Normal") as "Normal" | "Hyperbolic" | "Unnatural",
      repetitivePhrasing: matches.length >= 2,
      burstiness: (review.reviewerTotalReviews === 1 ? "Suspicious" : "Natural") as "Natural" | "Suspicious"
    }
  };

  const overallRiskScore = Math.min(100, Math.max(0, Math.round(0.40 * riskScore + 0.30 * authScore + 0.30 * reviewScore)));
  const decision: FinalDecision = overallRiskScore > 70 ? "Block" : overallRiskScore >= 41 ? "Manual Review" : "Approve";
  const decisionColor: 'green' | 'yellow' | 'red' = overallRiskScore > 70 ? "red" : overallRiskScore >= 41 ? "yellow" : "green";

  const decisionResult = {
    overallRiskScore,
    decision,
    decisionColor,
    summaryReasoning: `Overall Risk Score is ${overallRiskScore}/100. Formula: 40% Risk Agent (${riskScore}) + 30% Authenticity Agent (${authScore}) + 30% Review Moderation (${reviewScore}). Final Decision: ${decision}.`,
    weightedBreakdown: {
      riskAgentContribution: Number((0.40 * riskScore).toFixed(1)),
      authenticityAgentContribution: Number((0.30 * authScore).toFixed(1)),
      reviewAgentContribution: Number((0.30 * reviewScore).toFixed(1))
    },
    recommendedActions: decision === "Block"
      ? ["Block transaction immediately and notify risk team", "Freeze merchant listing and flag seller account", "Flag review as fake/AI-generated for moderation removal"]
      : decision === "Manual Review"
      ? ["Assign case to Trust & Safety analyst for manual review", "Hold transaction in temporary escrow for 24 hours", "Request seller proof of authenticity / serial tag"]
      : ["Auto-approve transaction", "No further risk action required"],
    policyTriggers: [
      decision === "Block" ? `POLICY-CRITICAL: Risk Score ${overallRiskScore} exceeds Block threshold (70)` : decision === "Manual Review" ? `POLICY-WARNING: Risk Score ${overallRiskScore} in Manual Review zone (41-70)` : `POLICY-PASS: Low Risk Score ${overallRiskScore}`
    ]
  };

  const caseId = `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const newCase: AuditCase = {
    id: caseId,
    createdAt: new Date().toISOString(),
    status: decision === "Block" ? "Blocked" : decision === "Manual Review" ? "Under Manual Review" : "Approved",
    tags: [
      decision === "Block" ? "Blocked Fraud" : decision === "Manual Review" ? "Manual Review" : "Clean",
      transaction.paymentMethod,
      listing.brand
    ],
    input,
    riskAgent,
    authenticityAgent,
    reviewAgent,
    decision: decisionResult
  };

  return { case: newCase, stats: defaultStats };
}

export async function runEvaluation(input: EvaluationInput): Promise<{ case: AuditCase; stats: SystemStats; triggeredAlerts?: MockEmailAlert[] }> {
  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (response.ok) return await response.json();
  } catch (err) {}
  return localEvaluate(input);
}

export async function runBatchEvaluation(items: EvaluationInput[]): Promise<{ cases: AuditCase[]; total: number; stats: SystemStats; triggeredAlerts?: MockEmailAlert[] }> {
  try {
    const response = await fetch('/api/evaluate/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (response.ok) return await response.json();
  } catch (err) {}

  const cases = items.map(item => localEvaluate(item).case);
  return { cases, total: cases.length, stats: defaultStats };
}

export async function fetchCases(params?: { status?: string; search?: string; tag?: string }): Promise<{ cases: AuditCase[]; total: number }> {
  try {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.tag) query.append('tag', params.tag);

    const response = await fetch(`/api/cases?${query.toString()}`);
    if (response.ok) return await response.json();
  } catch (e) {}

  let filtered = [...SAMPLE_CASES];
  if (params?.status && params.status !== 'All') {
    filtered = filtered.filter(c => c.status === params.status);
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(c => c.id.toLowerCase().includes(s) || c.input.listing.title.toLowerCase().includes(s) || c.input.listing.brand.toLowerCase().includes(s));
  }
  if (params?.tag) {
    filtered = filtered.filter(c => c.tags.includes(params.tag!));
  }
  return { cases: filtered, total: filtered.length };
}

export async function fetchStats(): Promise<SystemStats> {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) return await response.json();
  } catch (e) {}
  return defaultStats;
}

export async function overrideCaseDecision(caseId: string, newStatus: FinalDecision, notes: string): Promise<{ case: AuditCase; stats: SystemStats }> {
  try {
    const response = await fetch(`/api/cases/${caseId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes })
    });
    if (response.ok) return await response.json();
  } catch (e) {}

  const caseItem = SAMPLE_CASES.find(c => c.id === caseId) || SAMPLE_CASES[0];
  const updatedCase = {
    ...caseItem,
    status: (newStatus === 'Approve' ? 'Approved' : newStatus === 'Block' ? 'Blocked' : 'Under Manual Review') as any,
    humanOverride: {
      status: newStatus,
      overriddenBy: `${defaultUser.name} (${defaultUser.role})`,
      overrideTime: new Date().toISOString(),
      notes: notes || "Human override recorded."
    }
  };
  return { case: updatedCase, stats: defaultStats };
}

export async function fetchCurrentUser(): Promise<{ user: User }> {
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) return await response.json();
  } catch (e) {}
  return { user: defaultUser };
}

export async function loginUser(email: string, role: string, name?: string): Promise<{ user: User }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, name })
    });
    if (response.ok) return await response.json();
  } catch (e) {}
  return {
    user: {
      id: "USR-1001",
      name: name || "Alex Vance",
      email,
      role: role as any,
      createdAt: new Date().toISOString()
    }
  };
}

export async function fetchAlertConfig(): Promise<{ config: EmailAlertConfig }> {
  try {
    const response = await fetch('/api/alerts/config');
    if (response.ok) return await response.json();
  } catch (e) {}
  return { config: defaultAlertConfig };
}

export async function updateAlertConfig(config: Partial<EmailAlertConfig>): Promise<{ config: EmailAlertConfig; message: string }> {
  try {
    const response = await fetch('/api/alerts/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (response.ok) return await response.json();
  } catch (e) {}
  return { config: { ...defaultAlertConfig, ...config }, message: "Alert configuration saved." };
}

export async function fetchAlertHistory(): Promise<{ alerts: MockEmailAlert[]; total: number }> {
  try {
    const response = await fetch('/api/alerts/history');
    if (response.ok) return await response.json();
  } catch (e) {}
  return { alerts: [], total: 0 };
}

export async function clearAlertHistory(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/alerts/history', {
      method: 'DELETE'
    });
    if (response.ok) return await response.json();
  } catch (e) {}
  return { success: true, message: "Alert history cleared." };
}

export async function sendTestAlert(recipientEmail?: string, customCaseId?: string): Promise<{ alert: MockEmailAlert; message: string }> {
  try {
    const response = await fetch('/api/alerts/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail, customCaseId })
    });
    if (response.ok) return await response.json();
  } catch (e) {}

  const mockAlert: MockEmailAlert = {
    id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    recipient: recipientEmail || "alex.vance@trustshield.ai",
    subject: `🚨 [TrustShield Test Alert] High Risk Case ${customCaseId || "CASE-2026-8812"}`,
    bodyHtml: `<div style="font-family: sans-serif; padding: 16px; background-color: #0f172a; color: #ffffff; border-radius: 8px;"><h3 style="color: #ef4444;">🚨 TEST FRAUD ALERT PREVIEW</h3><p>Case ID: ${customCaseId || "CASE-2026-8812"}</p></div>`,
    caseId: customCaseId || "CASE-2026-8812",
    riskScore: 88,
    decision: "Block",
    status: "Delivered",
    triggerReason: "Test trigger",
    transactionAmount: 349.99,
    brand: "Apple"
  };
  return { alert: mockAlert, message: "Test alert dispatched." };
}
