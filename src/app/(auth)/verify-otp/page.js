'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      toast.error('Email not found. Please sign up again.');
      router.push('/signup');
      return;
    }
    // Auto focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (value && index === 5) {
      const filled = [...newOtp.slice(0, 5), value.slice(-1)];
      if (filled.every(d => d !== '')) {
        setTimeout(() => handleVerify(filled.join('')), 100);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();

    if (pasted.length === 6) {
      setTimeout(() => handleVerify(pasted), 100);
    }
  };

  const handleVerify = async (otpCode) => {
    const code = otpCode || otp.join('');

    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code })
      });

      // Safely parse JSON
      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Non-JSON response:', text);
        toast.error('Server error. Please try again.');
        setLoading(false);
        return;
      }

      if (data.success) {
        toast.success('Email verified! Please sign in.');
        router.push('/signin');
      } else {
        toast.error(data.error || 'Invalid OTP');
        // Shake animation
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);

    try {
      const response = await fetch('/api/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      let data;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        toast.error('Server error. Please try again.');
        return;
      }

      if (data.success) {
        toast.success('New OTP sent to your email!');
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        toast.error(data.error || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const filledCount = otp.filter(d => d !== '').length;
  const progressPercent = (filledCount / 6) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none'
      }} />

      {/* Decorative Blobs */}
      <div style={{
        position: 'absolute',
        top: '-10rem',
        right: '-10rem',
        width: '30rem',
        height: '30rem',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10rem',
        left: '-10rem',
        width: '30rem',
        height: '30rem',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '26rem', position: 'relative', zIndex: 1 }}>

        {/* Icon + Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '5rem',
            height: '5rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
            borderRadius: '1.5rem',
            marginBottom: '1.25rem',
            boxShadow: '0 10px 30px -5px rgba(99, 102, 241, 0.4)',
            position: 'relative'
          }}>
            <svg style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {/* Pulse ring */}
            <div style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '1.75rem',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              animation: 'pulse-ring 2s ease-out infinite'
            }} />
          </div>

          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}>
            Check Your Email
          </h1>

          <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
            We've sent a 6-digit verification code to
          </p>
          <p style={{
            fontSize: '0.9375rem',
            fontWeight: '600',
            color: '#6366f1',
            marginTop: '0.25rem',
            wordBreak: 'break-all'
          }}>
            {email}
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>

          {/* Progress Bar */}
          <div style={{
            height: '4px',
            background: '#f3f4f6',
            borderRadius: '2px',
            marginBottom: '1.5rem',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #6366f1 0%, #9333ea 100%)',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* OTP Inputs */}
          <div style={{
            display: 'flex',
            gap: '0.625rem',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            animation: shake ? 'shake 0.5s ease' : 'none'
          }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                style={{
                  width: '3.25rem',
                  height: '3.75rem',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: digit ? '#6366f1' : '#111827',
                  background: digit ? '#f5f3ff' : '#f9fafb',
                  border: `2px solid ${digit ? '#6366f1' : '#e5e7eb'}`,
                  borderRadius: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'text',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                  e.currentTarget.style.background = '#faf5ff';
                }}
                onBlur={e => {
                  if (!digit) {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = '#f9fafb';
                  } else {
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={loading || filledCount < 6}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: filledCount === 6
                ? 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)'
                : '#e5e7eb',
              color: filledCount === 6 ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '0.875rem',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: filledCount === 6 && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              boxShadow: filledCount === 6 ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
            onMouseEnter={e => {
              if (filledCount === 6 && !loading) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              if (filledCount === 6) {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <svg style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {filledCount === 6 ? 'Verify Email' : `Enter ${6 - filledCount} more digit${6 - filledCount !== 1 ? 's' : ''}`}
              </>
            )}
          </button>

          {/* Resend */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: countdown > 0 ? '#9ca3af' : '#6366f1',
                background: 'none',
                border: 'none',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
              onMouseEnter={e => {
                if (countdown === 0 && !resending) {
                  e.currentTarget.style.background = '#f5f3ff';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'none';
              }}
            >
              {resending ? (
                <>
                  <svg style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : countdown > 0 ? (
                <>
                  <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Resend OTP
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0.875rem',
          border: '1px solid rgba(99, 102, 241, 0.15)'
        }}>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '1.5rem',
              height: '1.5rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg style={{ width: '0.875rem', height: '0.875rem', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#374151', marginBottom: '0.375rem' }}>
                Quick Tips
              </p>
              <ul style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>• Check your spam or junk folder</li>
                <li>• Code expires in 10 minutes</li>
                <li>• You can paste the code directly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link
            href="/signup"
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#111827'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
          >
            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Sign Up
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }
      `}</style>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</p>
        </div>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}