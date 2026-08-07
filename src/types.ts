export type UserRole = 'trust_lead' | 'fraud_analyst' | 'merchant_reviewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface TransactionInput {
  transactionId?: string;
  amount: number;
  currency: string;
  paymentMethod: string; // e.g. 'Credit Card', 'COD (Cash on Delivery)', 'BNPL', 'Crypto', 'Wallet'
  deviceType: string;
  ipAddress: string;
  isVpnOrProxy: boolean;
  customerAgeDays: number;
  totalPastOrders: number;
  pastReturnsCount: number;
  pastChargebacksCount: number;
  velocity24h: number;
}

export interface ProductListingInput {
  listingId?: string;
  title: string;
  brand: string;
  listedPrice: number;
  msrpPrice: number;
  category: string;
  sellerRating: number;
  sellerAgeMonths: number;
  imageUrl?: string;
  description?: string;
  asin?: string;
  amazonUrl?: string;
}

export interface ReviewInput {
  reviewId?: string;
  reviewText: string;
  starRating: number;
  verifiedPurchase: boolean;
  reviewerAccountAgeDays: number;
  reviewerTotalReviews: number;
  submissionTime: string;
}

export interface EvaluationInput {
  transaction: TransactionInput;
  listing: ProductListingInput;
  review: ReviewInput;
}

export interface RiskAgentResult {
  score: number; // 0 to 100 (100 = highest fraud risk)
  probabilityPercent: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  explanation: string;
  signals: {
    name: string;
    riskImpact: 'Positive' | 'Neutral' | 'Negative' | 'Critical';
    detail: string;
  }[];
  datasetFeatures: {
    feature: string;
    value: string;
    ieeeCisBenchmark: string;
  }[];
}

export interface AuthenticityAgentResult {
  score: number; // 0 to 100 (100 = highest counterfeit likelihood)
  authenticityScore: number; // 100 - score
  counterfeitConfidencePercent: number;
  explanation: string;
  checks: {
    logoConsistency: { status: 'Pass' | 'Warning' | 'Fail'; score: number; detail: string };
    packagingQuality: { status: 'Pass' | 'Warning' | 'Fail'; score: number; detail: string };
    priceMsrpComparison: { status: 'Pass' | 'Warning' | 'Fail'; priceDiffPercent: number; detail: string };
    brandAuthorizedSeller: { status: 'Pass' | 'Warning' | 'Fail'; detail: string };
  };
}

export interface ReviewAgentResult {
  score: number; // 0 to 100 (100 = highest fake/AI review probability)
  classification: 'Genuine' | 'Suspicious' | 'Fake / AI-Generated';
  confidenceScorePercent: number;
  explanation: string;
  reasons: string[];
  nlpMetrics: {
    aiPatternScore: number; // 0 to 100
    sentimentExaggeration: 'Normal' | 'Hyperbolic' | 'Unnatural';
    repetitivePhrasing: boolean;
    burstiness: 'Natural' | 'Suspicious';
  };
}

export type FinalDecision = 'Approve' | 'Manual Review' | 'Block';

export interface DecisionEngineResult {
  overallRiskScore: number; // 40% Risk + 30% Auth + 30% Review
  decision: FinalDecision;
  decisionColor: 'green' | 'yellow' | 'red';
  summaryReasoning: string;
  weightedBreakdown: {
    riskAgentContribution: number; // 40% portion
    authenticityAgentContribution: number; // 30% portion
    reviewAgentContribution: number; // 30% portion
  };
  recommendedActions: string[];
  policyTriggers: string[];
  primaryRiskFactor?: string;
}

export interface AuditCase {
  id: string;
  createdAt: string;
  input: EvaluationInput;
  riskAgent: RiskAgentResult;
  authenticityAgent: AuthenticityAgentResult;
  reviewAgent: ReviewAgentResult;
  decision: DecisionEngineResult;
  humanOverride?: {
    status: FinalDecision;
    overriddenBy: string;
    overrideTime: string;
    notes: string;
  };
  status: 'Pending' | 'Approved' | 'Blocked' | 'Under Manual Review';
  tags: string[];
}

export interface SystemStats {
  totalEvaluated: number;
  approvedCount: number;
  manualReviewCount: number;
  blockedCount: number;
  totalFraudPreventedAmount: number;
  avgResponseTimeMs: number;
  agentAccuracy: {
    riskAgent: number;
    authenticityAgent: number;
    reviewAgent: number;
  };
}

export interface SmtpServerMock {
  host: string;
  port: number;
  senderAddress: string;
}

export interface EmailAlertConfig {
  enabled: boolean;
  recipientEmails: string[];
  riskScoreThreshold: number;
  notifyOnDecision: FinalDecision[];
  minAmountThreshold: number;
  webhookUrl?: string;
  smtpServerMock: SmtpServerMock;
}

export interface MockEmailAlert {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  bodyHtml: string;
  caseId: string;
  riskScore: number;
  decision: FinalDecision;
  status: 'Sent' | 'Delivered' | 'Failed';
  triggerReason: string;
  transactionAmount: number;
  brand: string;
}

export type AgentHealthStatus = 'healthy' | 'degraded' | 'offline';

export interface AgentHealthInfo {
  id: 'risk' | 'authenticity' | 'review';
  name: string;
  model: string;
  weight: string;
  status: AgentHealthStatus;
  latencyMs: number;
  uptimePercent: number;
  lastPing: string;
  endpoint: string;
  activeRequests: number;
}

export interface SystemHealthOverview {
  overallStatus: 'all_operational' | 'degraded' | 'critical';
  meshType: string;
  lastChecked: string;
  agents: AgentHealthInfo[];
}

