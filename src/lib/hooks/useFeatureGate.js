// src/lib/hooks/useFeatureGate.js
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PLANS, canUseQPG, canUseQPGAnswers, canAccessBooks, isAtLeast } from '@/lib/config/plans';

export function useFeatureGate() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const plan = subscription?.plan || 'free';
  const planDetails = PLANS[plan] || PLANS.free;

  useEffect(() => {
    if (!session) { setLoading(false); return; }

    fetch('/api/subscription/status')
      .then(r => r.json())
      .then(data => {
        if (data.success) setSubscription(data.subscription);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  return {
    plan,
    planDetails,
    subscription,
    loading,

    // Feature checks
    canChat:          true, // everyone can chat (limited by count)
    canUseQPG:        canUseQPG(plan),
    canUseQPGAnswers: canUseQPGAnswers(plan),
    canAccessBooks:   canAccessBooks(plan),
    isAtLeast:        (required) => isAtLeast(plan, required),

    // Usage
    messagesUsed:      subscription?.messagesUsed || 0,
    messagesLimit:     subscription?.messagesLimit || PLANS.free.limits.messagesPerMonth,
    messagesRemaining: Math.max(0,
      (subscription?.messagesLimit || PLANS.free.limits.messagesPerMonth) -
      (subscription?.messagesUsed || 0)
    ),
    isLimitReached:    (subscription?.messagesUsed || 0) >=
                       (subscription?.messagesLimit || PLANS.free.limits.messagesPerMonth),
  };
}