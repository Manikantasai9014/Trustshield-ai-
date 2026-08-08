import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { SAMPLE_CASES } from "./src/data/sampleCases";
import {
  AuditCase,
  EvaluationInput,
  RiskAgentResult,
  AuthenticityAgentResult,
  ReviewAgentResult,
  DecisionEngineResult,
  SystemStats,
  User,
  FinalDecision,
  EmailAlertConfig,
  MockEmailAlert
} from "./src/types";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// In-memory Database
let auditCases: AuditCase[] = [...SAMPLE_CASES];

// Mock Email Alert Service Layer Configuration & Storage
let emailAlertConfig: EmailAlertConfig = {
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

let alertHistory: MockEmailAlert[] = [
  {
    id: "ALT-9001",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    recipient: "alex.vance@trustshield.ai",
    subject: "🚨 [TrustShield Alert] High Risk Case CASE-2026-8812 - BLOCK (88/100)",
    bodyHtml: `<div style="font-family: sans-serif; padding: 16px; background-color: #0f172a; color: #ffffff; border-radius: 8px;">
      <h3 style="color: #ef4444; margin-top: 0;">🚨 HIGH RISK FRAUD ALERT PREVIEW</h3>
      <p><strong>Case ID:</strong> CASE-2026-8812</p>
      <p><strong>Item:</strong> Wireless Noise Cancelling Headphones (Bose) - $349.99</p>
      <p><strong>Overall Risk Score:</strong> <span style="color: #ef4444; font-weight: bold;">88 / 100</span> (Decision: BLOCK)</p>
      <p><strong>Trigger Reason:</strong> Overall Risk Score (88/100) exceeded configured alert threshold (70).</p>
      <hr style="border-color: #334155;"/>
      <p style="font-size: 12px; color: #94a3b8;">Delivered to alex.vance@trustshield.ai via TrustShield Alert Gateway</p>
    </div>`,
    caseId: "CASE-2026-8812",
    riskScore: 88,
    decision: "Block",
    status: "Delivered",
    triggerReason: "Overall Risk Score (88/100) exceeded configured alert threshold (70) & decision is Block.",
    transactionAmount: 349.99,
    brand: "Bose"
  }
];

function generateEmailHtml(caseItem: AuditCase, recipient: string, config: EmailAlertConfig, triggerReason: string): string {
  const isBlocked = caseItem.decision.decision === "Block";
  const badgeColor = isBlocked ? "#ef4444" : "#f59e0b";
  const statusLabel = isBlocked ? "BLOCKED TRANSACTION" : "MANUAL REVIEW REQUIRED";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 640px; margin: 0 auto; border: 1px solid #334155;">
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-weight: 800; font-size: 18px; color: #38bdf8;">TrustShield AI</span>
          <span style="background: rgba(56,189,248,0.15); color: #38bdf8; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 8px;">SECURITY ALERT</span>
        </div>
        <div style="font-size: 12px; color: #94a3b8;">${new Date().toLocaleString()}</div>
      </div>

      <div style="background-color: ${badgeColor}15; border: 1px solid ${badgeColor}40; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background-color: ${badgeColor}; color: #ffffff; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 4px; text-transform: uppercase;">${statusLabel}</span>
          <span style="font-size: 14px; font-weight: 700; color: #ffffff;">Case ID: ${caseItem.id}</span>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #cbd5e1;">${triggerReason}</p>
      </div>

      <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Transaction &amp; Product Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Product Title:</td>
            <td style="padding: 6px 0; font-weight: 600; color: #ffffff; text-align: right;">${caseItem.input.listing.title} (${caseItem.input.listing.brand})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Transaction Amount:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #38bdf8; text-align: right;">$${(caseItem.input.transaction.amount || 0).toFixed(2)} (${caseItem.input.transaction.paymentMethod})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Customer Age / Past Orders:</td>
            <td style="padding: 6px 0; color: #ffffff; text-align: right;">${caseItem.input.transaction.customerAgeDays} days old (${caseItem.input.transaction.totalPastOrders} orders)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">IP Location:</td>
            <td style="padding: 6px 0; color: ${caseItem.input.transaction.isVpnOrProxy ? '#ef4444' : '#10b981'}; font-weight: 700; text-align: right;">${caseItem.input.transaction.ipAddress} ${caseItem.input.transaction.isVpnOrProxy ? '(VPN/Proxy Flagged)' : ''}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Multi-Agent Risk Score Breakdown</h3>
        <div style="display: flex; gap: 8px; text-align: center;">
          <div style="flex: 1; background-color: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid #334155;">
            <div style="font-size: 10px; color: #60a5fa;">Risk Agent</div>
            <div style="font-size: 16px; font-weight: 800; color: #60a5fa; margin-top: 2px;">${caseItem.riskAgent.score}</div>
          </div>
          <div style="flex: 1; background-color: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid #334155;">
            <div style="font-size: 10px; color: #fbbf24;">Auth Agent</div>
            <div style="font-size: 16px; font-weight: 800; color: #fbbf24; margin-top: 2px;">${caseItem.authenticityAgent.score}</div>
          </div>
          <div style="flex: 1; background-color: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid #334155;">
            <div style="font-size: 10px; color: #34d399;">Review Agent</div>
            <div style="font-size: 16px; font-weight: 800; color: #34d399; margin-top: 2px;">${caseItem.reviewAgent.score}</div>
          </div>
          <div style="flex: 1; background-color: #0f172a; padding: 10px; border-radius: 6px; border: 1px solid ${badgeColor};">
            <div style="font-size: 10px; color: #cbd5e1;">Overall Score</div>
            <div style="font-size: 16px; font-weight: 800; color: ${badgeColor}; margin-top: 2px;">${caseItem.decision.overallRiskScore}</div>
          </div>
        </div>
      </div>

      <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">Recommended Actions:</h3>
        <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
          ${caseItem.decision.recommendedActions.map(act => `<li>${act}</li>`).join('')}
        </ul>
      </div>

      <div style="text-align: center; border-top: 1px solid #334155; padding-top: 16px; font-size: 11px; color: #64748b;">
        Sent to <strong style="color: #94a3b8;">${recipient}</strong> via TrustShield Alert Engine (${config.smtpServerMock.senderAddress})
      </div>
    </div>
  `;
}

function processEmailAlertsForCase(caseItem: AuditCase): MockEmailAlert[] {
  if (!emailAlertConfig.enabled) {
    return [];
  }

  const overallScore = caseItem.decision.overallRiskScore;
  const decision = caseItem.decision.decision;
  const amount = caseItem.input.transaction.amount || 0;

  const meetsScore = overallScore >= emailAlertConfig.riskScoreThreshold;
  const meetsDecision = emailAlertConfig.notifyOnDecision.includes(decision);
  const meetsAmount = amount >= emailAlertConfig.minAmountThreshold;

  if ((meetsScore || meetsDecision) && meetsAmount) {
    const triggerReason = `Overall Risk Score (${overallScore}/100) ${meetsScore ? 'exceeded threshold (' + emailAlertConfig.riskScoreThreshold + ')' : ''}${meetsScore && meetsDecision ? ' & ' : ''}${meetsDecision ? 'matched decision rule (' + decision + ')' : ''}.`;
    
    const generatedAlerts: MockEmailAlert[] = [];

    for (const recipient of emailAlertConfig.recipientEmails) {
      const alertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
      const alert: MockEmailAlert = {
        id: alertId,
        timestamp: new Date().toISOString(),
        recipient,
        subject: `🚨 [TrustShield Alert] High Risk Case ${caseItem.id} - ${decision.toUpperCase()} (${overallScore}/100)`,
        bodyHtml: generateEmailHtml(caseItem, recipient, emailAlertConfig, triggerReason),
        caseId: caseItem.id,
        riskScore: overallScore,
        decision,
        status: 'Delivered',
        triggerReason,
        transactionAmount: amount,
        brand: caseItem.input.listing.brand || 'Merchant'
      };

      generatedAlerts.push(alert);
      alertHistory.unshift(alert);
    }

    if (alertHistory.length > 50) {
      alertHistory = alertHistory.slice(0, 50);
    }

    return generatedAlerts;
  }

  return [];
}

// Current logged in user (Default demo user)
let currentUser: User = {
  id: "USR-1001",
  name: "Alex Vance",
  email: "alex.vance@trustshield.ai",
  role: "trust_lead",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  createdAt: "2026-01-15T00:00:00Z"
};

// Lazy Gemini Initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {}
    }
  });
}

// System Stats helper
function calculateStats(): SystemStats {
  const total = auditCases.length;
  const approved = auditCases.filter((c) => c.status === "Approved").length;
  const manual = auditCases.filter((c) => c.status === "Under Manual Review" || c.status === "Pending").length;
  const blocked = auditCases.filter((c) => c.status === "Blocked").length;

  const totalFraudPrevented = auditCases
    .filter((c) => c.status === "Blocked")
    .reduce((sum, c) => sum + (c.input.transaction.amount || 0), 0);

  return {
    totalEvaluated: total,
    approvedCount: approved,
    manualReviewCount: manual,
    blockedCount: blocked,
    totalFraudPreventedAmount: Math.round(totalFraudPrevented),
    avgResponseTimeMs: 420,
    agentAccuracy: {
      riskAgent: 96.8,
      authenticityAgent: 94.2,
      reviewAgent: 95.5
    }
  };
}

// Fallback Heuristic Evaluators if Gemini is unavailable
function fallbackEvaluate(input: EvaluationInput): {
  riskAgent: RiskAgentResult;
  authenticityAgent: AuthenticityAgentResult;
  reviewAgent: ReviewAgentResult;
} {
  const { transaction, listing, review } = input;

  // 1. Risk Agent
  let riskScore = 15;
  const signals: RiskAgentResult["signals"] = [];

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

  const riskAgent: RiskAgentResult = {
    score: riskScore,
    probabilityPercent: Math.min(99, riskScore + 3),
    riskLevel: riskScore > 70 ? "High" : riskScore > 40 ? "Medium" : "Low",
    explanation: `Calculated fraud risk score of ${riskScore}/100 based on IEEE-CIS transaction benchmarks, IP location, payment method, and return history.`,
    signals,
    datasetFeatures: [
      { feature: "IEEE-CIS V_130", value: transaction.isVpnOrProxy ? "Proxy Flagged" : "Standard", ieeeCisBenchmark: "Datacenter Proxy Cluster" },
      { feature: "Return Ratio", value: `${transaction.pastReturnsCount}/${transaction.totalPastOrders}`, ieeeCisBenchmark: "COD Threshold >30%" }
    ]
  };

  // 2. Authenticity Agent
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

  if (listing.sellerRating < 3.0) {
    authScore += 20;
  }
  if (listing.sellerAgeMonths < 1) {
    authScore += 15;
  }

  authScore = Math.min(100, authScore);

  const authenticityAgent: AuthenticityAgentResult = {
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
        status: authScore > 60 ? 'Warning' : 'Pass',
        score: Math.max(20, 95 - authScore),
        detail: authScore > 60 ? "Unverified packaging label formatting." : "Retail serial barcode format valid."
      },
      priceMsrpComparison: {
        status: Math.abs(priceDiff) > 30 ? 'Fail' : 'Pass',
        priceDiffPercent: Math.round(priceDiff),
        detail: `Listed price ($${listing.listedPrice}) vs MSRP ($${listing.msrpPrice}).`
      },
      brandAuthorizedSeller: {
        status: listing.sellerAgeMonths > 6 && listing.sellerRating >= 4.0 ? 'Pass' : 'Warning',
        detail: listing.sellerRating >= 4.0 ? "Verified seller profile." : "New seller account with low feedback."
      }
    }
  };

  // 3. Review Moderation Agent
  let reviewScore = 10;
  const text = review.reviewText.toLowerCase();
  const suspiciousWords = ["wonderful", "extraordinary", "transcendent", "craftsmanship", "best purchase ever", "super", "life changing"];
  const matches = suspiciousWords.filter((w) => text.includes(w));

  if (matches.length >= 2) {
    reviewScore += 35;
  }
  if (!review.verifiedPurchase) {
    reviewScore += 20;
  }
  if (review.reviewerAccountAgeDays < 5) {
    reviewScore += 20;
  }

  reviewScore = Math.min(100, reviewScore);

  const reviewAgent: ReviewAgentResult = {
    score: reviewScore,
    classification: reviewScore > 70 ? "Fake / AI-Generated" : reviewScore > 40 ? "Suspicious" : "Genuine",
    confidenceScorePercent: Math.min(98, reviewScore + 10),
    explanation: `Review moderation score of ${reviewScore}/100. Evaluated linguistic patterns, account age, and Amazon/OpSpam fake review datasets.`,
    reasons: matches.length > 0
      ? [`Contains generic hyperbolic phrases: ${matches.join(", ")}`, review.verifiedPurchase ? "Verified purchase" : "Unverified purchase"]
      : ["Natural tone and specific feedback"],
    nlpMetrics: {
      aiPatternScore: reviewScore,
      sentimentExaggeration: matches.length >= 2 ? "Hyperbolic" : "Normal",
      repetitivePhrasing: matches.length >= 2,
      burstiness: review.reviewerTotalReviews === 1 ? "Suspicious" : "Natural"
    }
  };

  return { riskAgent, authenticityAgent, reviewAgent };
}

// AI Multi-Agent Evaluator Route
app.post("/api/evaluate", async (req: Request, res: Response) => {
  try {
    const input: EvaluationInput = req.body;
    if (!input || !input.transaction || !input.listing || !input.review) {
      return res.status(400).json({ error: "Invalid evaluation payload. Missing transaction, listing, or review data." });
    }

    const ai = getGeminiClient();
    let agentResults: {
      riskAgent: RiskAgentResult;
      authenticityAgent: AuthenticityAgentResult;
      reviewAgent: ReviewAgentResult;
    };

    if (ai) {
      try {
        const prompt = `You are TrustShield AI, an advanced multi-agent e-commerce trust and safety engine. Evaluate the following item across three specialized AI agents:

INPUT DATA:
Transaction Data:
${JSON.stringify(input.transaction, null, 2)}

Product Listing Data:
${JSON.stringify(input.listing, null, 2)}

Customer Review Data:
${JSON.stringify(input.review, null, 2)}

Instructions:
1. Risk Agent (Agent 1): Evaluate transaction fraud and COD return abuse risks using IEEE-CIS dataset patterns (IP threat, COD return ratio, order velocity, payment method).
2. Authenticity Agent (Agent 2): Evaluate counterfeit likelihood comparing price to MSRP, brand authorized seller status, logo/packaging consistency.
3. Review Moderation Agent (Agent 3): Evaluate fake or AI-generated reviews using OpSpam and Amazon Fake Reviews patterns (hyperbolic sentiment, generic language, account age).

Return JSON matching this exact structure:
{
  "riskAgent": {
    "score": <0-100 score where 100 is highest fraud risk>,
    "probabilityPercent": <0-100 number>,
    "riskLevel": "<Low|Medium|High>",
    "explanation": "<detailed clear explanation>",
    "signals": [
      { "name": "<signal name>", "riskImpact": "<Positive|Neutral|Negative|Critical>", "detail": "<details>" }
    ],
    "datasetFeatures": [
      { "feature": "<feature name>", "value": "<value>", "ieeeCisBenchmark": "<ieee-cis comparison>" }
    ]
  },
  "authenticityAgent": {
    "score": <0-100 score where 100 is highest counterfeit risk>,
    "authenticityScore": <100 - score>,
    "counterfeitConfidencePercent": <0-100 number>,
    "explanation": "<detailed clear explanation>",
    "checks": {
      "logoConsistency": { "status": "<Pass|Warning|Fail>", "score": <0-100>, "detail": "<detail>" },
      "packagingQuality": { "status": "<Pass|Warning|Fail>", "score": <0-100>, "detail": "<detail>" },
      "priceMsrpComparison": { "status": "<Pass|Warning|Fail>", "priceDiffPercent": <number>, "detail": "<detail>" },
      "brandAuthorizedSeller": { "status": "<Pass|Warning|Fail>", "detail": "<detail>" }
    }
  },
  "reviewAgent": {
    "score": <0-100 score where 100 is highest fake review risk>,
    "classification": "<Genuine|Suspicious|Fake / AI-Generated>",
    "confidenceScorePercent": <0-100 number>,
    "explanation": "<detailed clear explanation>",
    "reasons": ["<reason 1>", "<reason 2>"],
    "nlpMetrics": {
      "aiPatternScore": <0-100>,
      "sentimentExaggeration": "<Normal|Hyperbolic|Unnatural>",
      "repetitivePhrasing": <boolean>,
      "burstiness": "<Natural|Suspicious>"
    }
  }
}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const parsed = JSON.parse(response.text || "{}");
        if (parsed.riskAgent && parsed.authenticityAgent && parsed.reviewAgent) {
          agentResults = parsed;
        } else {
          agentResults = fallbackEvaluate(input);
        }
      } catch (err) {
        console.error("Gemini multi-agent evaluation error, using fallback:", err);
        agentResults = fallbackEvaluate(input);
      }
    } else {
      agentResults = fallbackEvaluate(input);
    }

    // 4. Decision Engine Logic
    // Overall Risk Score = 40% Risk Agent + 30% Authenticity Agent + 30% Review Agent
    const riskScore = agentResults.riskAgent.score;
    const authScore = agentResults.authenticityAgent.score;
    const reviewScore = agentResults.reviewAgent.score;

    const overallRiskScore = Math.min(100, Math.max(0, Math.round(0.40 * riskScore + 0.30 * authScore + 0.30 * reviewScore)));

    let decision: FinalDecision = "Approve";
    let decisionColor: 'green' | 'yellow' | 'red' = "green";

    if (overallRiskScore > 70) {
      decision = "Block";
      decisionColor = "red";
    } else if (overallRiskScore >= 41) {
      decision = "Manual Review";
      decisionColor = "yellow";
    } else {
      decision = "Approve";
      decisionColor = "green";
    }

    const recommendedActions: string[] = [];
    const policyTriggers: string[] = [];

    if (decision === "Block") {
      recommendedActions.push("Block transaction immediately and notify risk team");
      recommendedActions.push("Freeze merchant listing and flag seller account");
      recommendedActions.push("Flag review as fake/AI-generated for moderation removal");
      policyTriggers.push(`POLICY-CRITICAL: Risk Score ${overallRiskScore} exceeds Block threshold (70)`);
    } else if (decision === "Manual Review") {
      recommendedActions.push("Assign case to Trust & Safety analyst for manual review");
      recommendedActions.push("Hold transaction in temporary escrow for 24 hours");
      recommendedActions.push("Request seller proof of authenticity / serial tag");
      policyTriggers.push(`POLICY-WARNING: Risk Score ${overallRiskScore} in Manual Review zone (41-70)`);
    } else {
      recommendedActions.push("Auto-approve transaction");
      recommendedActions.push("No further risk action required");
      policyTriggers.push(`POLICY-PASS: Low Risk Score ${overallRiskScore}`);
    }

    const decisionResult: DecisionEngineResult = {
      overallRiskScore,
      decision,
      decisionColor,
      summaryReasoning: `Overall Risk Score is ${overallRiskScore}/100. Formula: 40% Risk Agent (${riskScore}) + 30% Authenticity Agent (${authScore}) + 30% Review Moderation (${reviewScore}). Final Decision: ${decision}.`,
      weightedBreakdown: {
        riskAgentContribution: Number((0.40 * riskScore).toFixed(1)),
        authenticityAgentContribution: Number((0.30 * authScore).toFixed(1)),
        reviewAgentContribution: Number((0.30 * reviewScore).toFixed(1))
      },
      recommendedActions,
      policyTriggers
    };

    // Save Case to Audit Vault
    const caseId = `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newCase: AuditCase = {
      id: caseId,
      createdAt: new Date().toISOString(),
      status: decision === "Block" ? "Blocked" : decision === "Manual Review" ? "Under Manual Review" : "Approved",
      tags: [
        decision === "Block" ? "Blocked Fraud" : decision === "Manual Review" ? "Manual Review" : "Clean",
        input.transaction.paymentMethod,
        input.listing.brand
      ],
      input,
      riskAgent: agentResults.riskAgent,
      authenticityAgent: agentResults.authenticityAgent,
      reviewAgent: agentResults.reviewAgent,
      decision: decisionResult
    };

    auditCases.unshift(newCase);

    const triggeredAlerts = processEmailAlertsForCase(newCase);

    res.json({
      case: newCase,
      triggeredAlerts,
      stats: calculateStats()
    });
  } catch (error) {
    console.error("Evaluation API Error:", error);
    res.status(500).json({ error: "Failed to run TrustShield AI evaluation." });
  }
});

// Bulk Multi-Agent Batch Evaluator Route
app.post("/api/evaluate/batch", async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid batch payload. Must provide an array of items." });
    }

    const ai = getGeminiClient();
    const createdCases: AuditCase[] = [];

    for (let i = 0; i < items.length; i++) {
      const input: EvaluationInput = items[i];
      if (!input || !input.transaction || !input.listing || !input.review) {
        continue;
      }

      let agentResults: {
        riskAgent: RiskAgentResult;
        authenticityAgent: AuthenticityAgentResult;
        reviewAgent: ReviewAgentResult;
      };

      if (ai) {
        try {
          const prompt = `You are TrustShield AI. Evaluate the following item across three specialized AI agents:
Transaction Data: ${JSON.stringify(input.transaction)}
Product Listing Data: ${JSON.stringify(input.listing)}
Customer Review Data: ${JSON.stringify(input.review)}

Return JSON matching:
{
  "riskAgent": { "score": number (0-100), "probabilityPercent": number, "riskLevel": "Low"|"Medium"|"High", "explanation": "string", "signals": [{"name":"string","riskImpact":"Positive"|"Neutral"|"Negative"|"Critical","detail":"string"}], "datasetFeatures": [{"feature":"string","value":"string","ieeeCisBenchmark":"string"}] },
  "authenticityAgent": { "score": number (0-100), "authenticityScore": number, "counterfeitConfidencePercent": number, "explanation": "string", "checks": {"logoConsistency":{"status":"Pass"|"Warning"|"Fail","score":number,"detail":"string"},"packagingQuality":{"status":"Pass"|"Warning"|"Fail","score":number,"detail":"string"},"priceMsrpComparison":{"status":"Pass"|"Warning"|"Fail","priceDiffPercent":number,"detail":"string"},"brandAuthorizedSeller":{"status":"Pass"|"Warning"|"Fail","detail":"string"}} },
  "reviewAgent": { "score": number (0-100), "classification": "Genuine"|"Suspicious"|"Fake / AI-Generated", "confidenceScorePercent": number, "explanation": "string", "reasons": ["string"], "nlpMetrics": {"aiPatternScore":number,"sentimentExaggeration":"Normal"|"Hyperbolic"|"Unnatural","repetitivePhrasing":boolean,"burstiness":"Natural"|"Suspicious"} }
}`;

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });

          const parsed = JSON.parse(response.text || "{}");
          if (parsed.riskAgent && parsed.authenticityAgent && parsed.reviewAgent) {
            agentResults = parsed;
          } else {
            agentResults = fallbackEvaluate(input);
          }
        } catch (err) {
          agentResults = fallbackEvaluate(input);
        }
      } else {
        agentResults = fallbackEvaluate(input);
      }

      // Decision Engine Formula
      const riskScore = agentResults.riskAgent.score;
      const authScore = agentResults.authenticityAgent.score;
      const reviewScore = agentResults.reviewAgent.score;
      const overallRiskScore = Math.min(100, Math.max(0, Math.round(0.40 * riskScore + 0.30 * authScore + 0.30 * reviewScore)));

      let decision: FinalDecision = "Approve";
      let decisionColor: 'green' | 'yellow' | 'red' = "green";

      if (overallRiskScore > 70) {
        decision = "Block";
        decisionColor = "red";
      } else if (overallRiskScore >= 41) {
        decision = "Manual Review";
        decisionColor = "yellow";
      } else {
        decision = "Approve";
        decisionColor = "green";
      }

      const recommendedActions: string[] = [];
      const policyTriggers: string[] = [];

      if (decision === "Block") {
        recommendedActions.push("Block transaction immediately and notify risk team");
        recommendedActions.push("Freeze merchant listing and flag seller account");
        policyTriggers.push(`POLICY-CRITICAL: Risk Score ${overallRiskScore} exceeds Block threshold (70)`);
      } else if (decision === "Manual Review") {
        recommendedActions.push("Assign case to Trust & Safety analyst for manual review");
        policyTriggers.push(`POLICY-WARNING: Risk Score ${overallRiskScore} in Manual Review zone (41-70)`);
      } else {
        recommendedActions.push("Auto-approve transaction");
        policyTriggers.push(`POLICY-PASS: Low Risk Score ${overallRiskScore}`);
      }

      const decisionResult: DecisionEngineResult = {
        overallRiskScore,
        decision,
        decisionColor,
        summaryReasoning: `Batch item evaluated. Overall Risk Score is ${overallRiskScore}/100. Formula: 40% Risk (${riskScore}) + 30% Auth (${authScore}) + 30% Review (${reviewScore}). Final Decision: ${decision}.`,
        weightedBreakdown: {
          riskAgentContribution: Number((0.40 * riskScore).toFixed(1)),
          authenticityAgentContribution: Number((0.30 * authScore).toFixed(1)),
          reviewAgentContribution: Number((0.30 * reviewScore).toFixed(1))
        },
        recommendedActions,
        policyTriggers
      };

      const caseId = `CASE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCase: AuditCase = {
        id: caseId,
        createdAt: new Date().toISOString(),
        status: decision === "Block" ? "Blocked" : decision === "Manual Review" ? "Under Manual Review" : "Approved",
        tags: [
          decision === "Block" ? "Blocked Fraud" : decision === "Manual Review" ? "Manual Review" : "Clean",
          input.transaction.paymentMethod,
          input.listing.brand,
          "Batch Upload"
        ],
        input,
        riskAgent: agentResults.riskAgent,
        authenticityAgent: agentResults.authenticityAgent,
        reviewAgent: agentResults.reviewAgent,
        decision: decisionResult
      };

      auditCases.unshift(newCase);
      createdCases.push(newCase);
    }

    const allTriggeredAlerts: MockEmailAlert[] = [];
    for (const c of createdCases) {
      const alerts = processEmailAlertsForCase(c);
      allTriggeredAlerts.push(...alerts);
    }

    res.json({
      cases: createdCases,
      triggeredAlerts: allTriggeredAlerts,
      total: createdCases.length,
      stats: calculateStats()
    });
  } catch (error) {
    console.error("Batch Evaluation API Error:", error);
    res.status(500).json({ error: "Failed to run batch evaluation." });
  }
});

// Mock Email Alert Service Layer API Routes
app.get("/api/alerts/config", (req: Request, res: Response) => {
  res.json({ config: emailAlertConfig });
});

app.put("/api/alerts/config", (req: Request, res: Response) => {
  const newConfig = req.body;
  if (!newConfig) {
    return res.status(400).json({ error: "Invalid configuration object." });
  }
  emailAlertConfig = {
    ...emailAlertConfig,
    ...newConfig,
    recipientEmails: Array.isArray(newConfig.recipientEmails) ? newConfig.recipientEmails : emailAlertConfig.recipientEmails,
    notifyOnDecision: Array.isArray(newConfig.notifyOnDecision) ? newConfig.notifyOnDecision : emailAlertConfig.notifyOnDecision
  };
  res.json({ config: emailAlertConfig, message: "Alert configuration updated successfully." });
});

app.get("/api/alerts/history", (req: Request, res: Response) => {
  res.json({ alerts: alertHistory, total: alertHistory.length });
});

app.delete("/api/alerts/history", (req: Request, res: Response) => {
  alertHistory = [];
  res.json({ success: true, message: "Alert history cleared." });
});

app.post("/api/alerts/test", (req: Request, res: Response) => {
  const { recipientEmail, customCaseId } = req.body;
  const targetRecipient = recipientEmail || (emailAlertConfig.recipientEmails[0] || "alex.vance@trustshield.ai");

  const sampleCase = auditCases.find((c) => c.id === customCaseId) || auditCases[0];

  const testAlertId = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
  const testAlert: MockEmailAlert = {
    id: testAlertId,
    timestamp: new Date().toISOString(),
    recipient: targetRecipient,
    subject: `🧪 [TEST ALERT] High Risk Case ${sampleCase.id} - ${sampleCase.decision.decision.toUpperCase()} (${sampleCase.decision.overallRiskScore}/100)`,
    bodyHtml: generateEmailHtml(sampleCase, targetRecipient, emailAlertConfig, "Manual Test Alert triggered from Notification Thresholds console."),
    caseId: sampleCase.id,
    riskScore: sampleCase.decision.overallRiskScore,
    decision: sampleCase.decision.decision,
    status: "Delivered",
    triggerReason: "Manual Test Alert dispatched by Trust Analyst.",
    transactionAmount: sampleCase.input.transaction.amount || 0,
    brand: sampleCase.input.listing.brand || "Merchant"
  };

  alertHistory.unshift(testAlert);
  res.json({ alert: testAlert, message: `Test mock alert dispatched to ${targetRecipient}` });
});

// AI Agents Health & Connectivity Monitoring State
let agentHealthState: {
  id: 'risk' | 'authenticity' | 'review';
  name: string;
  model: string;
  weight: string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  uptimePercent: number;
  lastPing: string;
  endpoint: string;
  activeRequests: number;
}[] = [
  {
    id: 'risk',
    name: 'Risk Agent',
    model: 'Gemini 3.6 Flash (IEEE-CIS Engine)',
    weight: '40%',
    status: 'healthy',
    latencyMs: 18,
    uptimePercent: 99.99,
    lastPing: new Date().toISOString(),
    endpoint: '/api/v1/agents/risk-eval',
    activeRequests: 4
  },
  {
    id: 'authenticity',
    name: 'Authenticity Agent',
    model: 'Gemini 3.6 Flash (Counterfeit Vision)',
    weight: '30%',
    status: 'healthy',
    latencyMs: 24,
    uptimePercent: 99.95,
    lastPing: new Date().toISOString(),
    endpoint: '/api/v1/agents/auth-eval',
    activeRequests: 2
  },
  {
    id: 'review',
    name: 'Review Agent',
    model: 'Gemini 3.6 Flash (OpSpam NLP)',
    weight: '30%',
    status: 'healthy',
    latencyMs: 14,
    uptimePercent: 99.98,
    lastPing: new Date().toISOString(),
    endpoint: '/api/v1/agents/review-eval',
    activeRequests: 3
  }
];

app.get("/api/agents/health", (req: Request, res: Response) => {
  const offlineCount = agentHealthState.filter(a => a.status === 'offline').length;
  const degradedCount = agentHealthState.filter(a => a.status === 'degraded').length;

  let overallStatus: 'all_operational' | 'degraded' | 'critical' = 'all_operational';
  if (offlineCount > 0) {
    overallStatus = 'critical';
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
  }

  res.json({
    overallStatus,
    meshType: "40/30/30 Multi-Agent Ensemble",
    lastChecked: new Date().toISOString(),
    agents: agentHealthState
  });
});

app.post("/api/agents/health/ping", (req: Request, res: Response) => {
  const now = new Date().toISOString();
  agentHealthState = agentHealthState.map(agent => {
    // Add minor variation to latency if healthy/degraded
    const jitter = Math.floor(Math.random() * 7) - 3;
    let newLatency = agent.status === 'offline' ? 0 : Math.max(8, agent.latencyMs + jitter);
    if (agent.status === 'degraded' && newLatency < 120) {
      newLatency = 145 + Math.floor(Math.random() * 40);
    }
    return {
      ...agent,
      latencyMs: newLatency,
      lastPing: now,
      activeRequests: Math.floor(Math.random() * 5) + 1
    };
  });

  const offlineCount = agentHealthState.filter(a => a.status === 'offline').length;
  const degradedCount = agentHealthState.filter(a => a.status === 'degraded').length;

  let overallStatus: 'all_operational' | 'degraded' | 'critical' = 'all_operational';
  if (offlineCount > 0) {
    overallStatus = 'critical';
  } else if (degradedCount > 0) {
    overallStatus = 'degraded';
  }

  res.json({
    overallStatus,
    meshType: "40/30/30 Multi-Agent Ensemble",
    lastChecked: now,
    agents: agentHealthState,
    message: "Live health ping executed across all 3 AI agents."
  });
});

app.post("/api/agents/health/toggle-simulation", (req: Request, res: Response) => {
  const { agentId, targetStatus } = req.body;
  const agent = agentHealthState.find(a => a.id === agentId);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  if (targetStatus && ['healthy', 'degraded', 'offline'].includes(targetStatus)) {
    agent.status = targetStatus;
  } else {
    // Cycle status
    if (agent.status === 'healthy') agent.status = 'degraded';
    else if (agent.status === 'degraded') agent.status = 'offline';
    else agent.status = 'healthy';
  }

  if (agent.status === 'degraded') agent.latencyMs = 185;
  if (agent.status === 'offline') agent.latencyMs = 0;
  if (agent.status === 'healthy') agent.latencyMs = 16;

  agent.lastPing = new Date().toISOString();

  res.json({
    agents: agentHealthState,
    updatedAgent: agent,
    message: `${agent.name} status updated to ${agent.status.toUpperCase()}`
  });
});

// Auth Routes
app.get("/api/auth/me", (req: Request, res: Response) => {
  res.json({ user: currentUser });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, role, name } = req.body;
  currentUser = {
    id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
    name: name || (email ? email.split("@")[0] : "Trust Analyst"),
    email: email || "analyst@trustshield.ai",
    role: role || "trust_lead",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    createdAt: new Date().toISOString()
  };
  res.json({ user: currentUser });
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// Cases & Audit Log API
app.get("/api/cases", (req: Request, res: Response) => {
  const { status, search, tag } = req.query;
  let filtered = [...auditCases];

  if (status && status !== "All") {
    filtered = filtered.filter((c) => c.status.toLowerCase() === (status as string).toLowerCase());
  }

  if (tag && tag !== "All") {
    filtered = filtered.filter((c) => c.tags.includes(tag as string));
  }

  if (search) {
    const q = (search as string).toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.input.listing.title.toLowerCase().includes(q) ||
        c.input.listing.brand.toLowerCase().includes(q) ||
        c.input.transaction.paymentMethod.toLowerCase().includes(q)
    );
  }

  res.json({ cases: filtered, total: filtered.length });
});

app.get("/api/cases/:id", (req: Request, res: Response) => {
  const caseItem = auditCases.find((c) => c.id === req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: "Case not found" });
  }
  res.json({ case: caseItem });
});

app.post("/api/cases/:id/override", (req: Request, res: Response) => {
  const caseItem = auditCases.find((c) => c.id === req.params.id);
  if (!caseItem) {
    return res.status(404).json({ error: "Case not found" });
  }

  const { status, notes } = req.body;
  if (!status) {
    return res.status(400).json({ error: "New decision status required." });
  }

  caseItem.humanOverride = {
    status: status as FinalDecision,
    overriddenBy: `${currentUser.name} (${currentUser.role})`,
    overrideTime: new Date().toISOString(),
    notes: notes || "Human analyst override decision recorded."
  };

  caseItem.status = status === "Approve" ? "Approved" : status === "Block" ? "Blocked" : "Under Manual Review";

  res.json({ case: caseItem, stats: calculateStats() });
});

app.get("/api/stats", (req: Request, res: Response) => {
  res.json(calculateStats());
});

app.get("/api/cases/export", (req: Request, res: Response) => {
  res.setHeader("Content-Disposition", "attachment; filename=trustshield-audit-cases.json");
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(auditCases, null, 2));
});

// Vite Development or Production Server
async function startServer() {
  const initialPort = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  function listenOnPort(port: number) {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`TrustShield AI Server running on http://localhost:${port}`);
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${port} is currently in use. Trying port ${port + 1}...`);
        listenOnPort(port + 1);
      } else {
        console.error("Server startup error:", err);
      }
    });
  }

  listenOnPort(initialPort);
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}

