"use client";

// src/components/SubscriptionBadge.js
// ─────────────────────────────────────────────────────────────────────────────
// Drop this beside the profile button in your Navbar:
//   import SubscriptionBadge from '@/components/SubscriptionBadge';
//   <SubscriptionBadge />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// ── Plan metadata ─────────────────────────────────────────────────────────────
const PLAN_META = {
  free: {
    label: "Free",
    color: "#6b7280",
    bg: "#f3f4f6",
    gradient: "linear-gradient(135deg,#6b7280,#9ca3af)",
    emoji: "🆓",
    msgLimit: 15,
  },
  plus: {
    label: "Plus",
    color: "#3b82f6",
    bg: "#eff6ff",
    gradient: "linear-gradient(135deg,#3b82f6,#6366f1)",
    emoji: "⚡",
    msgLimit: 200,
  },
  pro: {
    label: "Pro",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)",
    emoji: "🚀",
    msgLimit: 600,
  },
  ranker: {
    label: "Ranker",
    color: "#f59e0b",
    bg: "#fffbeb",
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
    emoji: "🏆",
    msgLimit: 2000,
  },
};

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function SubscriptionBadge() {
  const { data: session } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null); // subscription status response
  const [loading, setLoading] = useState(false); // fetching status
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const panelRef = useRef(null);

  // ── Fetch subscription status ────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/status");
      const json = await res.json();
      if (json.success) setData(json);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Initial fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);
  // ── Auto-refresh when a message is sent ──────────────────────────────────────
  useEffect(() => {
    // Listen for custom event fired by chat
    const handler = () => fetchStatus();
    window.addEventListener("gtu:message-sent", handler);
    return () => window.removeEventListener("gtu:message-sent", handler);
  }, [fetchStatus]);

  // ── Poll every 30s while panel is open ───────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [open, fetchStatus]);

  // Refetch when panel opens
  useEffect(() => {
    if (open) fetchStatus();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setConfirmCancel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Cancel subscription ─────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success(
          "Subscription cancelled. Access continues until " + fmt(json.endDate),
        );
        setConfirmCancel(false);
        fetchStatus();
      } else {
        toast.error(json.error || "Failed to cancel");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCancelling(false);
    }
  };

  if (!session) return null;

  const plan = data?.plan || "free";
  const meta = PLAN_META[plan] || PLAN_META.free;
  const usage = data?.usage;
  const sub = data?.subscription;
  const isFree = plan === "free";
  const isCancelled = sub?.status === "cancelled";
  const pct = usage
    ? Math.min(
        100,
        Math.round((usage.messagesUsed / usage.messagesLimit) * 100),
      )
    : 0;
  const barColor = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#10b981";

  return (
    <div
      ref={panelRef}
      style={{ position: "relative", display: "inline-block" }}
    >
      {/* ── BADGE TRIGGER ── */}
      <button
        onClick={() => {
          setOpen((o) => !o);
          setConfirmCancel(false);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.375rem 0.75rem",
          background: meta.bg,
          border: `1.5px solid ${meta.color}30`,
          borderRadius: "2rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = meta.color + "70";
          e.currentTarget.style.boxShadow = `0 2px 12px ${meta.color}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = meta.color + "30";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Dot */}
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: meta.gradient,
            flexShrink: 0,
          }}
        />
        {/* Label */}
        <span
          style={{
            fontSize: "0.775rem",
            fontWeight: 700,
            color: meta.color,
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}
        >
          {meta.label}
        </span>
        {/* Usage mini pill — hide on small if free */}
        {usage && (
          <span
            style={{
              fontSize: "0.7rem",
              color: meta.color + "cc",
              fontWeight: 500,
              background: meta.color + "15",
              borderRadius: "1rem",
              padding: "0.1rem 0.4rem",
            }}
          >
            {usage.messagesUsed}/{usage.messagesLimit}
          </span>
        )}
        {/* Chevron */}
        <svg
          style={{
            width: 12,
            height: 12,
            color: meta.color,
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* ── DROPDOWN PANEL ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.625rem)",
            right: 0,
            width: 320,
            zIndex: 9999,
            background: "white",
            borderRadius: "1.125rem",
            border: "1px solid #e5e7eb",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
            overflow: "hidden",
            animation: "sbFadeIn 0.18s ease",
          }}
        >
          <style>{`
            @keyframes sbFadeIn {
              from { opacity:0; transform:translateY(-6px) scale(0.98); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
            @keyframes sbSpin {
              from { transform:rotate(0deg); }
              to   { transform:rotate(360deg); }
            }
          `}</style>

          {loading && !data ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "0.875rem",
              }}
            >
              <div
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  border: "2px solid #e5e7eb",
                  borderTop: `2px solid ${meta.color}`,
                  borderRadius: "50%",
                  animation: "sbSpin 0.8s linear infinite",
                  margin: "0 auto 0.75rem",
                }}
              />
              Loading...
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <div
                style={{
                  padding: "1.125rem 1.25rem",
                  borderBottom: "1px solid #f3f4f6",
                  background: `linear-gradient(135deg, ${meta.color}08, ${meta.color}04)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "2rem",
                        height: "2rem",
                        borderRadius: "0.5rem",
                        flexShrink: 0,
                        background: meta.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                      }}
                    >
                      {meta.emoji}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {meta.label} Plan
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {isFree
                          ? "Free forever"
                          : isCancelled
                            ? "⚠️ Cancelled"
                            : sub?.endDate
                              ? `Renews ${fmt(sub.endDate)}`
                              : "Active"}
                      </div>
                    </div>
                  </div>
                  {isCancelled && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: "#ef4444",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "2rem",
                        padding: "0.2rem 0.5rem",
                      }}
                    >
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* ── Usage bar ── */}
              {usage && (
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      Messages used
                    </span>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: pct >= 90 ? "#ef4444" : "#374151",
                      }}
                    >
                      {usage.messagesUsed} / {usage.messagesLimit}
                    </span>
                  </div>
                  {/* Bar */}
                  <div
                    style={{
                      height: 6,
                      background: "#f3f4f6",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background:
                          pct >= 90
                            ? "linear-gradient(90deg,#ef4444,#dc2626)"
                            : pct >= 70
                              ? "linear-gradient(90deg,#f59e0b,#d97706)"
                              : meta.gradient,
                        borderRadius: 3,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      marginTop: "0.375rem",
                    }}
                  >
                    {usage.messagesRemaining} messages remaining this month
                    {pct >= 90 && (
                      <span style={{ color: "#ef4444", fontWeight: 600 }}>
                        {" "}
                        — Almost out!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Subscription dates ── */}
              {sub && !isFree && (
                <div
                  style={{
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid #f3f4f6",
                    display: "flex",
                    gap: "1rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#9ca3af",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Started
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      {fmt(sub.startDate)}
                    </div>
                  </div>
                  <div style={{ width: 1, background: "#f3f4f6" }} />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "#9ca3af",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: "0.2rem",
                      }}
                    >
                      {isCancelled ? "Access until" : "Next renewal"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: isCancelled ? "#ef4444" : "#374151",
                      }}
                    >
                      {fmt(sub.endDate)}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Cancelled warning ── */}
              {isCancelled && (
                <div
                  style={{
                    margin: "0.75rem 1.25rem",
                    padding: "0.75rem",
                    background: "#fef3c7",
                    border: "1px solid #fcd34d",
                    borderRadius: "0.625rem",
                    fontSize: "0.8125rem",
                    color: "#92400e",
                    lineHeight: 1.5,
                  }}
                >
                  ⚠️ Your subscription is cancelled. You retain full access
                  until <strong>{fmt(sub?.endDate)}</strong>, after which your
                  plan reverts to Free.
                </div>
              )}

              {/* ── Actions ── */}
              <div
                style={{
                  padding: "0.875rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {/* Upgrade button — show for all non-ranker plans */}
                {plan !== "ranker" && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/pricing");
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6875rem",
                      background: meta.gradient,
                      color: "white",
                      border: "none",
                      borderRadius: "0.625rem",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.375rem",
                      boxShadow: `0 4px 12px ${meta.color}30`,
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = `0 6px 18px ${meta.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${meta.color}30`;
                    }}
                  >
                    ⚡ {isFree ? "Upgrade Plan" : "Upgrade to Higher Plan"}
                  </button>
                )}

                {/* Change plan — for paid plans */}
                {!isFree && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/pricing");
                    }}
                    style={{
                      width: "100%",
                      padding: "0.625rem",
                      background: "#f9fafb",
                      color: "#374151",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.625rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#f9fafb";
                    }}
                  >
                    🔄 Change Plan
                  </button>
                )}

                {/* Cancel — only for active (non-cancelled) paid plans */}
                {!isFree && !isCancelled && !confirmCancel && (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      background: "transparent",
                      color: "#9ca3af",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "color 0.2s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#ef4444")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#9ca3af")
                    }
                  >
                    Cancel subscription
                  </button>
                )}

                {/* Confirm cancel dialog */}
                {confirmCancel && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "0.75rem",
                      padding: "1rem",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "#991b1b",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Cancel subscription?
                    </div>
                    <div
                      style={{
                        fontSize: "0.8125rem",
                        color: "#7f1d1d",
                        lineHeight: 1.5,
                        marginBottom: "0.875rem",
                      }}
                    >
                      No refund will be issued. You'll keep your {meta.label}{" "}
                      benefits until{" "}
                      <strong>
                        {sub?.endDate
                          ? fmt(sub.endDate)
                          : "end of billing period"}
                      </strong>
                      , then revert to Free.
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          background: "white",
                          color: "#374151",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.5rem",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Keep plan
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={cancelling}
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          background: cancelling ? "#fca5a5" : "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: "0.5rem",
                          fontSize: "0.8125rem",
                          fontWeight: 700,
                          cursor: cancelling ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          transition: "background 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.3rem",
                        }}
                      >
                        {cancelling ? (
                          <>
                            <div
                              style={{
                                width: "0.875rem",
                                height: "0.875rem",
                                border: "2px solid rgba(255,255,255,0.4)",
                                borderTop: "2px solid white",
                                borderRadius: "50%",
                                animation: "sbSpin 0.8s linear infinite",
                              }}
                            />
                            Cancelling...
                          </>
                        ) : (
                          "Yes, cancel"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Footer ── */}
              <div
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "#f9fafb",
                  borderTop: "1px solid #f3f4f6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  No refunds on cancellation
                </span>
                <button
                  onClick={fetchStatus}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    fontSize: "0.75rem",
                    fontFamily: "inherit",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#6366f1")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#9ca3af")
                  }
                >
                  ↻ Refresh
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
