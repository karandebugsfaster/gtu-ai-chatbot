"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import SubscriptionBadge from "../SubscriptionBadge";

export default function Navbar({ onMenuClick }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

const handleSignOut = async () => {
  await signOut({ callbackUrl: "/signin" });
};

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          margin: "0 auto",
          padding: "0 1rem",
          height: "3.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem",
              background: "transparent",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              color: "#374151",
              transition: "all 0.2s ease",
            }}
            className="mobile-menu-btn"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = "#111827";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#374151";
            }}
          >
            <svg
              style={{ width: "1.5rem", height: "1.5rem" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <Link
            href="/chat"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "2rem",
                height: "2rem",
                background: "linear-gradient(135deg, #6366f1 0%, #9333ea 100%)",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
              }}
            >
              <svg
                style={{ width: "1.25rem", height: "1.25rem", color: "white" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: "1.125rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #6366f1 0%, #9333ea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              GTU AI
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {session ? (
            <>
              {/* New Chat Button */}
              <button
                onClick={() => router.push("/chat")}
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "transparent",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                className="new-chat-btn"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.color = "#6366f1";
                  e.currentTarget.style.background = "#f5f3ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.color = "#374151";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg
                  style={{ width: "1rem", height: "1rem" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Chat
              </button>

              <SubscriptionBadge />

              {/* User Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.375rem",
                    background: "transparent",
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#d1d5db";
                    e.currentTarget.style.background = "#f9fafb";
                  }}
                  onMouseLeave={(e) => {
                    if (!showDropdown) {
                      e.currentTarget.style.borderColor = "#e5e7eb";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "2rem",
                      height: "2rem",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #9333ea 100%)",
                      borderRadius: "0.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                    }}
                  >
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      color: "#111827",
                      maxWidth: "8rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "none",
                    }}
                    className="user-name"
                  >
                    {session.user.name}
                  </span>
                  <svg
                    style={{
                      width: "1rem",
                      height: "1rem",
                      color: "#9ca3af",
                      transform: showDropdown
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      display: "none",
                    }}
                    className="dropdown-arrow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    <div
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 40,
                      }}
                      onClick={() => setShowDropdown(false)}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 0.5rem)",
                        right: 0,
                        minWidth: "14rem",
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "0.75rem",
                        boxShadow:
                          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        padding: "0.5rem",
                        zIndex: 50,
                        animation: "slideDown 0.2s ease",
                      }}
                    >
                      {/* User Info */}
                      <div
                        style={{
                          padding: "0.75rem",
                          borderBottom: "1px solid #f3f4f6",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {session.user.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            wordBreak: "break-all",
                          }}
                        >
                          {session.user.email}
                        </div>
                      </div>

                      {/* Menu Items
                      // <Link
                      //   href="/pricing"
                      //   style={{
                      //     display: "flex",
                      //     alignItems: "center",
                      //     gap: "0.75rem",
                      //     padding: "0.625rem 0.75rem",
                      //     borderRadius: "0.5rem",
                      //     fontSize: "0.875rem",
                      //     color: "#374151",
                      //     textDecoration: "none",
                      //     transition: "all 0.2s ease",
                      //   }}
                      //   onMouseEnter={(e) => {
                      //     e.currentTarget.style.background = "#f9fafb";
                      //     e.currentTarget.style.color = "#111827";
                      //   }}
                      //   onMouseLeave={(e) => {
                      //     e.currentTarget.style.background = "transparent";
                      //     e.currentTarget.style.color = "#374151";
                      //   }}
                      // >
                      //   <svg
                      //     style={{ width: "1.125rem", height: "1.125rem" }}
                      //     fill="none"
                      //     stroke="currentColor"
                      //     viewBox="0 0 24 24"
                      //   >
                      //     <path
                      //       strokeLinecap="round"
                      //       strokeLinejoin="round"
                      //       strokeWidth={2}
                      //       d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      //     />
                      //   </svg>
                      //   Upgrade to Pro
                      // </Link> */}

                      {session.user.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.625rem 0.75rem",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                            color: "#374151",
                            textDecoration: "none",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f9fafb";
                            e.currentTarget.style.color = "#111827";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#374151";
                          }}
                        >
                          <svg
                            style={{ width: "1.125rem", height: "1.125rem" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}

                      <div
                        style={{
                          height: "1px",
                          background: "#f3f4f6",
                          margin: "0.5rem 0",
                        }}
                      />

                      <button
                        onClick={handleSignOut}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.625rem 0.75rem",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem",
                          color: "#dc2626",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#fef2f2";
                          e.currentTarget.style.color = "#b91c1c";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#dc2626";
                        }}
                      >
                        <svg
                          style={{ width: "1.125rem", height: "1.125rem" }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Link
                href="/signin"
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  color: "#374151",
                  textDecoration: "none",
                  borderRadius: "0.5rem",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#374151";
                }}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "white",
                  textDecoration: "none",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #9333ea 100%)",
                  borderRadius: "0.5rem",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(99, 102, 241, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(99, 102, 241, 0.3)";
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 768px) {
          .new-chat-btn {
            display: flex !important;
          }
          .user-name {
            display: block !important;
          }
          .dropdown-arrow {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
