import { AuditCase } from '../types';

export const SAMPLE_CASES: AuditCase[] = [
  {
    id: "CASE-2026-8901",
    createdAt: "2026-08-07T06:15:20Z",
    status: "Blocked",
    tags: ["High COD Risk", "Counterfeit Logo", "AI Fake Review"],
    input: {
      transaction: {
        transactionId: "TXN-773219",
        amount: 899.00,
        currency: "USD",
        paymentMethod: "COD (Cash on Delivery)",
        deviceType: "Mobile (Android 14)",
        ipAddress: "185.220.101.5 (Datacenter Proxy)",
        isVpnOrProxy: true,
        customerAgeDays: 2,
        totalPastOrders: 4,
        pastReturnsCount: 3,
        pastChargebacksCount: 1,
        velocity24h: 7
      },
      listing: {
        listingId: "LST-900412",
        title: "Apple AirPods Max Wireless Headphone - Silver (Brand New Sealed)",
        brand: "Apple",
        listedPrice: 149.00,
        msrpPrice: 549.00,
        category: "Consumer Electronics",
        sellerRating: 2.1,
        sellerAgeMonths: 0.5,
        imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
        description: "Official original genuine headphones with noise cancellation and high sound bass quality. Fast shipping guarantee.",
        asin: "B08N5WRWNW",
        amazonUrl: "https://www.amazon.com/dp/B08N5WRWNW"
      },
      review: {
        reviewId: "REV-10492",
        reviewText: "This item is super wonderful! The sound quality is remarkably extraordinary and transcendent. I am thoroughly blown away by the craftsmanship. Best purchase ever made in my entire life!",
        starRating: 5,
        verifiedPurchase: false,
        reviewerAccountAgeDays: 1,
        reviewerTotalReviews: 1,
        submissionTime: "2026-08-07T06:10:00Z"
      }
    },
    riskAgent: {
      score: 88,
      probabilityPercent: 91.5,
      riskLevel: "High",
      explanation: "Critical risk flags detected: Transaction originated from a known VPN/Proxy IP (Datacenter range). Customer account is 2 days old with a 75% return ratio (3 returns on 4 orders) using Cash on Delivery (COD), matching high-risk IEEE-CIS fraud signatures.",
      signals: [
        { name: "IP & Network Security", riskImpact: "Critical", detail: "Datacenter VPN Proxy detected (IEEE-CIS fraud match 94.2%)" },
        { name: "COD Return History", riskImpact: "Negative", detail: "3 returns out of 4 past orders (75% return abuse ratio)" },
        { name: "Order Velocity", riskImpact: "Negative", detail: "7 orders attempted in the last 24 hours" },
        { name: "Account Longevity", riskImpact: "Negative", detail: "Account created 2 days ago" }
      ],
      datasetFeatures: [
        { feature: "V_feature (IEEE-CIS)", value: "V130 = 4.2", ieeeCisBenchmark: "High risk cluster (>3.8)" },
        { feature: "Addr1 / Addr2 Match", value: "Mismatch", ieeeCisBenchmark: "82% fraud probability on mismatch" },
        { feature: "C14 Velocity", value: "7 in 24h", ieeeCisBenchmark: "Anomaly threshold >3" }
      ]
    },
    authenticityAgent: {
      score: 92,
      authenticityScore: 8,
      counterfeitConfidencePercent: 94.0,
      explanation: "High counterfeit probability. Listed price ($149) is discounted by 72.8% below MSRP ($549). Logo placement on headband shows alignment distortion, and unverified seller is 14 days old.",
      checks: {
        logoConsistency: { status: "Fail", score: 25, detail: "Font kerning and Apple logo positioning mismatch official brand vectors." },
        packagingQuality: { status: "Warning", score: 40, detail: "Packaging box lacks official serial label holograms." },
        priceMsrpComparison: { status: "Fail", priceDiffPercent: -72.8, detail: "Price ($149) is suspiciously low compared to official MSRP ($549)." },
        brandAuthorizedSeller: { status: "Fail", detail: "Seller is not an authorized distributor or verified merchant." }
      }
    },
    reviewAgent: {
      score: 85,
      classification: "Fake / AI-Generated",
      confidenceScorePercent: 88.0,
      explanation: "High probability of AI-generated fake review. Review exhibits repetitive superlative adjectives ('extraordinary and transcendent') with zero specific product detail from an unverified 1-day old account.",
      reasons: [
        "Unnatural linguistic perplexity and burstiness typical of LLM output",
        "Hyperbolic sentiment without mentioning physical headphone attributes",
        "Unverified purchase submitted within 10 minutes of product creation"
      ],
      nlpMetrics: {
        aiPatternScore: 89,
        sentimentExaggeration: "Unnatural",
        repetitivePhrasing: true,
        burstiness: "Suspicious"
      }
    },
    decision: {
      overallRiskScore: 88,
      decision: "Block",
      decisionColor: "red",
      summaryReasoning: "Transaction blocked due to combined critical risk factors across all 3 AI agents: High COD Return Fraud (88), Counterfeit Product Listing (92), and AI-Generated Fake Review (85).",
      weightedBreakdown: {
        riskAgentContribution: 35.2, // 40% of 88
        authenticityAgentContribution: 27.6, // 30% of 92
        reviewAgentContribution: 25.5 // 30% of 85
      },
      recommendedActions: [
        "Block transaction TXN-773219 immediately",
        "Freeze merchant listing LST-900412 pending counterfeit investigation",
        "Remove fake review REV-10492 and flag reviewer account",
        "Log incident to Trust & Safety Audit Vault"
      ],
      policyTriggers: [
        "POLICY-801: COD Fraud Threshold Exceeded (>75)",
        "POLICY-402: Counterfeit Price Variance >50%",
        "POLICY-109: Synthetic/AI Review Detection Triggered"
      ]
    }
  },
  {
    id: "CASE-2026-8902",
    createdAt: "2026-08-07T05:40:12Z",
    status: "Under Manual Review",
    tags: ["MSRP Price Variance", "Unverified Reviewer", "Manual Inspection"],
    input: {
      transaction: {
        transactionId: "TXN-664102",
        amount: 320.00,
        currency: "USD",
        paymentMethod: "Credit Card",
        deviceType: "Desktop (Mac OS)",
        ipAddress: "72.21.217.1 (Residential)",
        isVpnOrProxy: false,
        customerAgeDays: 140,
        totalPastOrders: 12,
        pastReturnsCount: 2,
        pastChargebacksCount: 0,
        velocity24h: 1
      },
      listing: {
        listingId: "LST-449102",
        title: "Nike Air Jordan 1 Retro High OG - Chicago Colorway",
        brand: "Nike",
        listedPrice: 110.00,
        msrpPrice: 180.00,
        category: "Footwear",
        sellerRating: 3.8,
        sellerAgeMonths: 4,
        imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
        description: "Pre-owned lightly worn pair of original Jordan 1s. Comes with original box and extra laces.",
        asin: "B09B3RRV6Y",
        amazonUrl: "https://www.amazon.com/dp/B09B3RRV6Y"
      },
      review: {
        reviewId: "REV-88319",
        reviewText: "Shoes look nice in person, stitching seems solid on the toe box. Delivery was 2 days late though so giving 4 stars.",
        starRating: 4,
        verifiedPurchase: true,
        reviewerAccountAgeDays: 60,
        reviewerTotalReviews: 5,
        submissionTime: "2026-08-07T05:20:00Z"
      }
    },
    riskAgent: {
      score: 22,
      probabilityPercent: 21.0,
      riskLevel: "Low",
      explanation: "Transaction characteristics appear safe. Residential IP address, credit card payment, established customer account (140 days) with low return ratio (16.6%).",
      signals: [
        { name: "Payment Integrity", riskImpact: "Positive", detail: "Standard Credit Card with 3D Secure verification" },
        { name: "IP & Network", riskImpact: "Positive", detail: "Residential IP with low threat score" },
        { name: "Customer Tenure", riskImpact: "Positive", detail: "140 days tenure, 12 successful past orders" }
      ],
      datasetFeatures: [
        { feature: "Device Match", value: "Mac OS Safari", ieeeCisBenchmark: "Standard consumer profile" }
      ]
    },
    authenticityAgent: {
      score: 68,
      authenticityScore: 32,
      counterfeitConfidencePercent: 71.0,
      explanation: "Moderate-high authenticity concern. Price is $110 (-38.8% below retail) for a high-demand item. Swoosh logo stitching exhibits minor inconsistency compared to Nike retail standards.",
      checks: {
        logoConsistency: { status: "Warning", score: 55, detail: "Swoosh curve angle shows 4.2% deviation from official vector guidelines." },
        packagingQuality: { status: "Pass", score: 78, detail: "Box tag formatting and font weight align with Nike standards." },
        priceMsrpComparison: { status: "Warning", priceDiffPercent: -38.8, detail: "Listed price is lower than typical resale market value." },
        brandAuthorizedSeller: { status: "Warning", detail: "Individual reseller on marketplace platform." }
      }
    },
    reviewAgent: {
      score: 18,
      classification: "Genuine",
      confidenceScorePercent: 92.0,
      explanation: "Review appears completely authentic. Contains specific product feedback ('stitching on toe box', '2 days late delivery') from a verified buyer.",
      reasons: [
        "Balanced sentiment with concrete product details",
        "Verified purchase tag confirmed by backend order log",
        "Natural review length and realistic tone"
      ],
      nlpMetrics: {
        aiPatternScore: 12,
        sentimentExaggeration: "Normal",
        repetitivePhrasing: false,
        burstiness: "Natural"
      }
    },
    decision: {
      overallRiskScore: 35 + 20, // 55 total risk score
      decision: "Manual Review",
      decisionColor: "yellow",
      summaryReasoning: "Overall risk score is 35 (Manual Review Zone: 41-70). While transaction risk (22) and review quality (18) are low, the product listing authenticity agent raised a 68 risk score due to logo deviation and low resale price.",
      weightedBreakdown: {
        riskAgentContribution: 8.8, // 40% of 22
        authenticityAgentContribution: 20.4, // 30% of 68
        reviewAgentContribution: 5.4 // 30% of 18
      },
      recommendedActions: [
        "Request secondary physical photo verification of Nike Swoosh & inner size tag from seller",
        "Allow transaction to hold in escrow for 24 hours",
        "Assign to Marketplace Brand Protection Specialist"
      ],
      policyTriggers: [
        "POLICY-204: Resale Market Price Anomaly Flag",
        "POLICY-501: Logo Micro-Deviation Flagged by Computer Vision"
      ]
    }
  },
  {
    id: "CASE-2026-8903",
    createdAt: "2026-08-07T04:10:05Z",
    status: "Approved",
    tags: ["Verified Merchant", "Clean Transaction", "Authentic Review"],
    input: {
      transaction: {
        transactionId: "TXN-901234",
        amount: 85.00,
        currency: "USD",
        paymentMethod: "Credit Card",
        deviceType: "Desktop (Windows 11)",
        ipAddress: "24.182.12.90 (ISP Consumer Broadband)",
        isVpnOrProxy: false,
        customerAgeDays: 450,
        totalPastOrders: 38,
        pastReturnsCount: 1,
        pastChargebacksCount: 0,
        velocity24h: 1
      },
      listing: {
        listingId: "LST-110293",
        title: "Logitech MX Master 3S Wireless Performance Mouse - Graphite",
        brand: "Logitech",
        listedPrice: 99.00,
        msrpPrice: 99.00,
        category: "Computer Accessories",
        sellerRating: 4.9,
        sellerAgeMonths: 36,
        imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
        description: "Official Logitech MX Master 3S mouse. Quiet clicks, 8K DPI tracking on glass, Ergonomic design.",
        asin: "B0B9BD353M",
        amazonUrl: "https://www.amazon.com/dp/B0B9BD353M"
      },
      review: {
        reviewId: "REV-55410",
        reviewText: "The quiet click button makes a huge difference in my office environment! Battery lasts weeks between USB-C charges. Highly recommend for developers.",
        starRating: 5,
        verifiedPurchase: true,
        reviewerAccountAgeDays: 300,
        reviewerTotalReviews: 14,
        submissionTime: "2026-08-07T03:50:00Z"
      }
    },
    riskAgent: {
      score: 5,
      probabilityPercent: 2.1,
      riskLevel: "Low",
      explanation: "Exceptional transaction safety profile. Verified customer with 38 past orders, 0 chargebacks, 450-day account age, purchasing via credit card from a clean domestic IP.",
      signals: [
        { name: "Customer Reputation", riskImpact: "Positive", detail: "38 successful orders, 0 chargebacks" },
        { name: "IP & Network", riskImpact: "Positive", detail: "Residential ISP, zero proxy threat" },
        { name: "Velocity Check", riskImpact: "Positive", detail: "Single purchase in 24 hours" }
      ],
      datasetFeatures: [
        { feature: "Clean History", value: "38 orders", ieeeCisBenchmark: "Top 5% trusted buyer category" }
      ]
    },
    authenticityAgent: {
      score: 4,
      authenticityScore: 96,
      counterfeitConfidencePercent: 3.0,
      explanation: "100% genuine product listing. Matches MSRP exactly ($99), listed by a 36-month verified merchant with 4.9 rating. Packaging and logo vectors match Logitech official specifications.",
      checks: {
        logoConsistency: { status: "Pass", score: 98, detail: "Logitech G / MX logo typography perfectly matches vector brand asset." },
        packagingQuality: { status: "Pass", score: 96, detail: "Retail box barcode and serial format verified." },
        priceMsrpComparison: { status: "Pass", priceDiffPercent: 0, detail: "Listed price matches official retail MSRP exactly ($99)." },
        brandAuthorizedSeller: { status: "Pass", detail: "Logitech Official Direct Marketplace Partner." }
      }
    },
    reviewAgent: {
      score: 6,
      classification: "Genuine",
      confidenceScorePercent: 98.0,
      explanation: "Fully authentic review. Specific feedback on 'quiet click buttons', 'office environment', 'USB-C charging', written by a 300-day old account with 14 past reviews.",
      reasons: [
        "Highly specific domain knowledge and usage context",
        "Natural linguistic variation and balanced feedback",
        "Verified purchase history across 14 product categories"
      ],
      nlpMetrics: {
        aiPatternScore: 4,
        sentimentExaggeration: "Normal",
        repetitivePhrasing: false,
        burstiness: "Natural"
      }
    },
    decision: {
      overallRiskScore: 5,
      decision: "Approve",
      decisionColor: "green",
      summaryReasoning: "Transaction approved automatically with minimal risk score (5/100). All 3 agents passed checks with high confidence.",
      weightedBreakdown: {
        riskAgentContribution: 2.0, // 40% of 5
        authenticityAgentContribution: 1.2, // 30% of 4
        reviewAgentContribution: 1.8 // 30% of 6
      },
      recommendedActions: [
        "Process transaction TXN-901234 immediately",
        "Award trusted buyer reward points to customer",
        "No further action required"
      ],
      policyTriggers: [
        "POLICY-001: Auto-Approve Trusted Buyer & Verified Seller Pair"
      ]
    }
  }
];
