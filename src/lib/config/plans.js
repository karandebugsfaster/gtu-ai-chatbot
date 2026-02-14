// src/lib/config/plans.js
// ─── SINGLE SOURCE OF TRUTH FOR ALL PLANS & FEATURES ─────────────────────────
// Import this ANYWHERE: frontend, API routes, middleware

export const PLANS = {
  free: {
    id:           'free',
    name:         'Free',
    tagline:      'Get started',
    price:        0,
    priceDisplay: '₹0',
    period:       'forever',
    color:        '#6b7280',
    gradient:     'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
    bg:           '#f9fafb',
    border:       '#e5e7eb',

    limits: {
      messagesPerMonth: 15,        // First 15 messages free — then paywall
      qpgEnabled:       false,     // No question paper generator
      qpgAnswers:       false,     // No answers
      booksAccess:      false,     // No GTU books
      historyDays:      7,         // Chat history for 7 days only
      fileUploads:      false,     // No file uploads
    },

    features: [
      { text: '15 messages per month',         included: true  },
      { text: 'GTU subject Q&A',               included: true  },
      { text: 'Basic PYQ browsing',            included: true  },
      { text: 'Question Paper Generator',      included: false },
      { text: 'GTU Books & Notes',             included: false },
      { text: 'AI-generated answers',          included: false },
      { text: 'Priority response speed',       included: false },
    ],
  },

  plus: {
    id:           'plus',
    name:         'GTU-AI Plus',
    tagline:      'For regular learners',
    price:        99,
    priceDisplay: '₹99',
    period:       'per month',
    color:        '#3b82f6',
    gradient:     'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    bg:           '#eff6ff',
    border:       '#bfdbfe',
    razorpayPlanId: process.env.RAZORPAY_PLAN_PLUS || '',

    limits: {
      messagesPerMonth: 200,
      qpgEnabled:       false,
      qpgAnswers:       false,
      booksAccess:      false,
      historyDays:      30,
      fileUploads:      false,
    },

    features: [
      { text: '200 messages per month',        included: true  },
      { text: 'GTU subject Q&A',               included: true  },
      { text: 'Full PYQ browsing',             included: true  },
      { text: '30-day chat history',           included: true  },
      { text: 'Question Paper Generator',      included: false },
      { text: 'GTU Books & Notes',             included: false },
      { text: 'AI-generated answers',          included: false },
    ],
  },

  pro: {
    id:           'pro',
    name:         'GTU-AI Pro',
    tagline:      'For serious students',
    price:        199,
    priceDisplay: '₹199',
    period:       'per month',
    color:        '#6366f1',
    gradient:     'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
    bg:           '#f5f3ff',
    border:       '#ddd6fe',
    popular:      true,
    razorpayPlanId: process.env.RAZORPAY_PLAN_PRO || '',

    limits: {
      messagesPerMonth: 600,
      qpgEnabled:       true,      // QPG access — questions only
      qpgAnswers:       false,     // No answers yet
      booksAccess:      false,     // No books
      historyDays:      90,
      fileUploads:      false,
    },

    features: [
      { text: '600 messages per month',        included: true  },
      { text: 'GTU subject Q&A',               included: true  },
      { text: 'Full PYQ browsing',             included: true  },
      { text: '90-day chat history',           included: true  },
      { text: 'Question Paper Generator',      included: true  },
      { text: 'GTU Books & Notes',             included: false },
      { text: 'AI-generated answers',          included: false },
    ],
  },

  ranker: {
    id:           'ranker',
    name:         'GTU-AI Ranker',
    tagline:      'For toppers only',
    price:        349,
    priceDisplay: '₹349',
    period:       'per month',
    color:        '#f59e0b',
    gradient:     'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    bg:           '#fffbeb',
    border:       '#fde68a',
    badge:        '🏆',
    razorpayPlanId: process.env.RAZORPAY_PLAN_RANKER || '',

    limits: {
      messagesPerMonth: 2000,      // Effectively unlimited for most users
      qpgEnabled:       true,
      qpgAnswers:       true,      // Full answers in generated papers
      booksAccess:      true,      // GTU books & reference material
      historyDays:      365,       // 1 year history
      fileUploads:      true,      // Upload own PDFs
    },

    features: [
      { text: '2000 messages per month',       included: true  },
      { text: 'GTU subject Q&A',               included: true  },
      { text: 'Full PYQ browsing',             included: true  },
      { text: '1-year chat history',           included: true  },
      { text: 'Question Paper Generator',      included: true  },
      { text: 'GTU Books & Notes',             included: true  },
      { text: 'AI-generated answers',          included: true  },
    ],
  },
};

// ─── FEATURE GATE HELPERS ─────────────────────────────────────────────────────
// Use these in API routes to check permissions cleanly

export function canUseQPG(plan) {
  return PLANS[plan]?.limits?.qpgEnabled ?? false;
}

export function canUseQPGAnswers(plan) {
  return PLANS[plan]?.limits?.qpgAnswers ?? false;
}

export function canAccessBooks(plan) {
  return PLANS[plan]?.limits?.booksAccess ?? false;
}

export function getMessageLimit(plan) {
  return PLANS[plan]?.limits?.messagesPerMonth ?? PLANS.free.limits.messagesPerMonth;
}

export function getPlanById(planId) {
  return PLANS[planId] ?? PLANS.free;
}

// Plan hierarchy for upgrade checks: free < plus < pro < ranker
const PLAN_RANK = { free: 0, plus: 1, pro: 2, ranker: 3 };

export function isAtLeast(userPlan, requiredPlan) {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[requiredPlan] ?? 0);
}

export const PLANS_LIST = Object.values(PLANS);