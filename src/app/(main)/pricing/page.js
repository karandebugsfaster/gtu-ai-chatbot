'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PLANS, PLANS_LIST } from '@/lib/config/plans';
import toast from 'react-hot-toast';

// ─── PRICING PAGE ──────────────────────────────────────────────────────────────
export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentPlan, setCurrentPlan]   = useState('free');
  const [loading, setLoading]           = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // for future annual toggle

  useEffect(() => {
    if (!session) return;
    fetch('/api/subscription/status')
      .then(r => r.json())
      .then(d => { if (d.success) setCurrentPlan(d.plan || 'free'); })
      .catch(() => {});
  }, [session]);

  const handleUpgrade = async (plan) => {
    if (!session) {
      router.push('/signin?callbackUrl=/pricing');
      return;
    }
    if (plan.id === 'free' || plan.id === currentPlan) return;

    setProcessingPlan(plan.id);
    setLoading(true);

    try {
      // Load Razorpay script
      await loadRazorpay();

      const res  = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to create order');
        return;
      }

const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: data.amount,
  currency: 'INR',
  name: 'GTU-AI',
  description: `${plan.name} — Monthly`,
  order_id: data.orderId,
  prefill: {
    name: session.user?.name || '',
    email: session.user?.email || '',
  },
  theme: { color: plan.color },
  handler: async (response) => {
    const verifyRes = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        planId: plan.id,
      }),
    });

    const verifyData = await verifyRes.json();

    if (verifyData.success) {
      toast.success(`🎉 Welcome to ${plan.name}!`);
      setCurrentPlan(plan.id);
    } else {
      toast.error('Payment verification failed.');
    }
  },
};


      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setProcessingPlan(null);
    }
  };

  const loadRazorpay = () => new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });

  const plans = PLANS_LIST;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      color: 'white',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background ambient glows */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 60% 50% at 20% 20%, rgba(99,102,241,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 40% at 80% 70%, rgba(245,158,11,0.08) 0%, transparent 70%),
          radial-gradient(ellipse 40% 60% at 60% 10%, rgba(147,51,234,0.08) 0%, transparent 70%)
        `,
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '4rem 1rem 6rem' }}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', maxWidth: '44rem', margin: '0 auto 4rem' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.375rem 1rem',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '2rem',
            fontSize: '0.8125rem',
            fontWeight: '600',
            color: '#a5b4fc',
            letterSpacing: '0.05em',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
          }}>
            <span>✦</span>
            Simple, transparent pricing
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '1.25rem',
            letterSpacing: '-0.03em',
          }}>
            Study smarter,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              rank higher
            </span>
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: '1.7',
            marginBottom: '2rem',
          }}>
            Every GTU student starts free. Upgrade when you're ready to unlock the full power of AI-assisted exam prep.
          </p>

          {/* Free trial badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '2rem',
            fontSize: '0.9rem',
            color: '#34d399',
            fontWeight: '600',
          }}>
            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            First 15 messages always free — no card required
          </div>
        </div>

        {/* ── PLANS GRID ─────────────────────────────────────────────────── */}
        <div style={{
          maxWidth: '72rem',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}>
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlan}
              isProcessing={processingPlan === plan.id}
              onUpgrade={() => handleUpgrade(plan)}
              delay={i * 80}
            />
          ))}
        </div>

        {/* ── COMPARISON TABLE ───────────────────────────────────────────── */}
        <div style={{ maxWidth: '56rem', margin: '5rem auto 0' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '2rem',
            color: 'rgba(255,255,255,0.9)',
          }}>
            Everything you get
          </h2>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '1.25rem',
            overflow: 'hidden',
          }}>
            <ComparisonTable currentPlan={currentPlan} />
          </div>
        </div>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <div style={{ maxWidth: '40rem', margin: '5rem auto 0' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: '700',
            marginBottom: '2rem',
            color: 'rgba(255,255,255,0.9)',
          }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FAQ.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </div>

        {/* ── BOTTOM CTA ─────────────────────────────────────────────────── */}
        <div style={{
          maxWidth: '36rem',
          margin: '5rem auto 0',
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(147,51,234,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '1.5rem',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
          <h3 style={{ fontSize: '1.375rem', fontWeight: '700', marginBottom: '0.75rem' }}>
            Built for GTU students
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Trained on GTU syllabus, PYQs, and study materials. Not a generic AI — built specifically to help you pass and top your exams.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['CE', 'IT', 'EC', 'IC', 'ME', 'Civil'].map(b => (
              <span key={b} style={{
                padding: '0.375rem 0.875rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '2rem',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: 'rgba(255,255,255,0.6)',
              }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
      `}</style>
    </div>
  );
}

// ─── PLAN CARD ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, isCurrent, isProcessing, onUpgrade, delay }) {
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const isFree    = plan.id === 'free';
  const isRanker  = plan.id === 'ranker';
  const isPopular = plan.popular;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: isCurrent
          ? `linear-gradient(135deg, ${plan.color}18 0%, ${plan.color}08 100%)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isCurrent
          ? plan.color + '60'
          : hovered
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '1.25rem',
        padding: '2rem',
        cursor: 'default',
        transition: 'all 0.25s ease',
        transform: hovered && !isCurrent ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px ${plan.color}30`
          : isCurrent
            ? `0 0 0 2px ${plan.color}40`
            : 'none',
        opacity: mounted ? 1 : 0,
        animation: mounted ? `fadeUp 0.4s ease ${delay}ms both` : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Popular badge */}
      {isPopular && !isCurrent && (
        <div style={{
          position: 'absolute', top: '-1px', left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.3rem 1.25rem',
          background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
          borderRadius: '0 0 0.875rem 0.875rem',
          fontSize: '0.6875rem',
          fontWeight: '800',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'white',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          whiteSpace: 'nowrap',
        }}>
          ✦ Most Popular
        </div>
      )}

      {/* Current plan badge */}
      {isCurrent && (
        <div style={{
          position: 'absolute', top: '-1px', right: '1.25rem',
          padding: '0.25rem 0.875rem',
          background: plan.gradient,
          borderRadius: '0 0 0.75rem 0.75rem',
          fontSize: '0.6875rem',
          fontWeight: '700',
          color: 'white',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Current
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingTop: (isPopular || isCurrent) ? '0.75rem' : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
          {/* Color dot */}
          <div style={{
            width: '0.75rem', height: '0.75rem',
            borderRadius: '50%',
            background: plan.gradient,
            boxShadow: `0 0 8px ${plan.color}80`,
          }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>
            {plan.tagline?.toUpperCase()}
          </span>
          {plan.badge && <span style={{ fontSize: '1rem' }}>{plan.badge}</span>}
        </div>

        <h3 style={{
          fontSize: '1.375rem',
          fontWeight: '800',
          color: 'white',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
        }}>
          {plan.name}
        </h3>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
          <span style={{
            fontSize: isFree ? '2.5rem' : '2.75rem',
            fontWeight: '800',
            letterSpacing: '-0.03em',
            background: plan.gradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {plan.priceDisplay}
          </span>
          <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>
            /{plan.period}
          </span>
        </div>
      </div>

      {/* Features */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem' }}>
        {plan.features.map((feature, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            opacity: feature.included ? 1 : 0.35,
          }}>
            <div style={{
              width: '1.25rem', height: '1.25rem',
              borderRadius: '50%',
              background: feature.included
                ? plan.gradient
                : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {feature.included ? (
                <svg style={{ width: '0.625rem', height: '0.625rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg style={{ width: '0.625rem', height: '0.625rem', color: 'rgba(255,255,255,0.4)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: '0.875rem', color: feature.included ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)', lineHeight: '1.4' }}>
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={onUpgrade}
        disabled={isFree || isCurrent || isProcessing}
        style={{
          width: '100%',
          padding: '0.875rem',
          background: isCurrent
            ? 'rgba(255,255,255,0.06)'
            : isFree
              ? 'rgba(255,255,255,0.06)'
              : plan.gradient,
          color: isCurrent || isFree ? 'rgba(255,255,255,0.4)' : 'white',
          border: `1px solid ${isCurrent || isFree ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
          borderRadius: '0.875rem',
          fontSize: '0.9375rem',
          fontWeight: '700',
          cursor: isFree || isCurrent ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: !isFree && !isCurrent ? `0 4px 15px ${plan.color}40` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={e => {
          if (!isFree && !isCurrent) {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = `0 8px 25px ${plan.color}50`;
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)';
          if (!isFree && !isCurrent) e.currentTarget.style.boxShadow = `0 4px 15px ${plan.color}40`;
        }}
      >
        {isProcessing ? (
          <>
            <svg style={{ width: '1.125rem', height: '1.125rem', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : isCurrent ? (
          '✓ Current Plan'
        ) : isFree ? (
          'Free Forever'
        ) : (
          `Upgrade to ${plan.name.replace('GTU-AI ', '')}`
        )}
      </button>

      <style jsx>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ─── COMPARISON TABLE ──────────────────────────────────────────────────────────
function ComparisonTable({ currentPlan }) {
  const rows = [
    { feature: 'Monthly messages',        free: '15',       plus: '200',      pro: '600',       ranker: '2,000'     },
    { feature: 'GTU PYQ access',          free: '✓',        plus: '✓',        pro: '✓',         ranker: '✓'         },
    { feature: 'AI chat',                 free: '✓',        plus: '✓',        pro: '✓',         ranker: '✓'         },
    { feature: 'Chat history',            free: '7 days',   plus: '30 days',  pro: '90 days',   ranker: '1 year'    },
    { feature: 'Question Paper Gen.',     free: '✗',        plus: '✗',        pro: '✓',         ranker: '✓'         },
    { feature: 'QPG with Answers',        free: '✗',        plus: '✗',        pro: '✗',         ranker: '✓'         },
    { feature: 'GTU Books access',        free: '✗',        plus: '✗',        pro: '✗',         ranker: '✓'         },
    { feature: 'Upload own PDFs',         free: '✗',        plus: '✗',        pro: '✗',         ranker: '✓'         },
    { feature: 'Priority AI speed',       free: '✗',        plus: '✓',        pro: '✓',         ranker: '✓'         },
  ];

  const cols = ['free', 'plus', 'pro', 'ranker'];
  const headers = ['Free', 'Plus', 'Pro', 'Ranker'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', fontWeight: '600', width: '35%' }}>
              Feature
            </th>
            {cols.map((col, i) => (
              <th key={col} style={{
                padding: '1.25rem 1rem',
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: '800',
                color: currentPlan === col
                  ? PLANS[col].color
                  : 'rgba(255,255,255,0.7)',
              }}>
                {headers[i]}
                {currentPlan === col && (
                  <div style={{ fontSize: '0.625rem', fontWeight: '600', color: PLANS[col].color, marginTop: '0.25rem' }}>
                    (you)
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                borderBottom: ri < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}
            >
              <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                {row.feature}
              </td>
              {cols.map(col => (
                <td key={col} style={{
                  padding: '1rem',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: row[col] === '✓'
                    ? '#34d399'
                    : row[col] === '✗'
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.8)',
                  background: currentPlan === col ? `${PLANS[col].color}08` : 'transparent',
                }}>
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────────
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '0.875rem',
      overflow: 'hidden',
      transition: 'border-color 0.2s ease',
      borderColor: open ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
    }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', padding: '1.125rem 1.25rem',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1rem', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'rgba(255,255,255,0.85)' }}>
          {q}
        </span>
        <svg
          style={{
            width: '1.125rem', height: '1.125rem',
            color: '#6366f1', flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0)',
          }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {open && (
        <div style={{
          padding: '0 1.25rem 1.125rem',
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.5)',
          lineHeight: '1.7',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '0.875rem',
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

const FAQ = [
  {
    q: 'Can I use GTU-AI for free?',
    a: 'Yes! Every account starts with 15 free messages per month. No credit card required. You can browse PYQs and access basic features without paying anything.',
  },
  {
    q: 'What counts as a "message"?',
    a: 'Each time you send a question to the AI and receive a response counts as one message. Browsing PYQs, generating question papers (for Pro/Ranker), and accessing books do not count as messages.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel your subscription at any time. You\'ll continue to have access to your plan features until the end of the billing period.',
  },
  {
    q: 'What is the Question Paper Generator?',
    a: 'Pro and Ranker plans get access to our AI-powered question paper generator. It creates GTU-style question papers for any subject and semester. Ranker plan additionally gets AI-generated model answers.',
  },
  {
    q: 'What GTU books are available on Ranker?',
    a: 'Ranker plan users get access to all textbooks, reference materials, and notes that have been uploaded to the platform by our admin team. More books are added regularly.',
  },
  {
    q: 'Is there a student discount?',
    a: 'Our pricing is already student-friendly at ₹99-₹349/month. We\'re working on semester-based annual plans that will give you even better value. Stay tuned!',
  },
];