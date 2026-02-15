"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = useSession();
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState({});
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });

    // Intersection observer for scroll reveals
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting)
            setVisible((p) => ({ ...p, [e.target.dataset.reveal]: true }));
        }),
      { threshold: 0.15 },
    );
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
      observer.disconnect();
    };
  }, []);

  const revealed = (key, delay = 0) => ({
    opacity: visible[key] ? 1 : 0,
    transform: visible[key] ? "translateY(0)" : "translateY(40px)",
    transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --gold:   #c9a84c;
          --gold2:  #f0c060;
          --dark:   #080810;
          --dark2:  #0d0d1a;
          --dark3:  #12122a;
          --text:   #e8e4d9;
          --muted:  #7a7a9a;
          --border: rgba(201,168,76,0.15);
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--dark);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          overflow-x: hidden;
        }

        ::selection { background: rgba(201,168,76,0.3); color: #fff; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--dark); }
        ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }

        /* ── Noise overlay ── */
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 0; opacity: 0.4;
        }

        /* ── Cursor glow ── */
        .cursor-glow {
          position: fixed; width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%);
          pointer-events: none; z-index: 1;
          transform: translate(-50%, -50%);
          transition: left 0.1s, top 0.1s;
        }

        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1.25rem 3rem;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid transparent;
          transition: all 0.3s ease;
        }
        .nav.scrolled {
          background: rgba(8,8,16,0.85);
          backdrop-filter: blur(20px);
          border-bottom-color: var(--border);
        }
        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem; font-weight: 700;
          color: var(--text);
          text-decoration: none;
          display: flex; align-items: center; gap: 0.75rem;
        }
        .nav-logo-badge {
          width: 2rem; height: 2rem;
          background: linear-gradient(135deg, var(--gold), var(--gold2));
          border-radius: 0.375rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.875rem;
        }
        .nav-links { display: flex; align-items: center; gap: 2rem; }
        .nav-link {
          color: var(--muted); text-decoration: none;
          font-size: 0.9rem; font-weight: 500;
          transition: color 0.2s;
        }
        .nav-link:hover { color: var(--text); }
        .nav-cta {
          padding: 0.625rem 1.5rem;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--gold);
          border-radius: 0.5rem;
          font-size: 0.875rem; font-weight: 600;
          cursor: pointer; text-decoration: none;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-cta:hover {
          background: rgba(201,168,76,0.1);
          border-color: var(--gold);
        }

        /* ── Hero ── */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 8rem 2rem 4rem;
          position: relative;
          overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 20% 70%, rgba(201,168,76,0.06) 0%, transparent 50%);
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%);
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.375rem 1rem;
          border: 1px solid var(--border);
          border-radius: 2rem;
          font-size: 0.8125rem; color: var(--gold);
          background: rgba(201,168,76,0.05);
          margin-bottom: 2rem;
          opacity: 0; animation: fadeUp 0.8s ease 0.2s forwards;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--gold);
          animation: pulse 2s ease infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.5); }
        }
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 8vw, 7rem);
          font-weight: 900;
          line-height: 1.0;
          letter-spacing: -0.02em;
          color: var(--text);
          opacity: 0; animation: fadeUp 0.8s ease 0.4s forwards;
        }
        .hero-title-accent {
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold2) 50%, #fff8e0 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          max-width: 560px;
          font-size: 1.125rem; color: var(--muted);
          line-height: 1.7; margin-top: 1.5rem;
          font-weight: 300;
          opacity: 0; animation: fadeUp 0.8s ease 0.6s forwards;
        }
        .hero-actions {
          display: flex; align-items: center; gap: 1rem;
          margin-top: 3rem; flex-wrap: wrap; justify-content: center;
          opacity: 0; animation: fadeUp 0.8s ease 0.8s forwards;
        }
        .btn-primary {
          padding: 1rem 2.5rem;
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold2) 100%);
          color: #0a0808;
          border: none; border-radius: 0.625rem;
          font-size: 1rem; font-weight: 700;
          cursor: pointer; text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.3s ease;
          position: relative; overflow: hidden;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .btn-primary::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(201,168,76,0.4); }
        .btn-primary:hover::after { opacity: 1; }
        .btn-secondary {
          padding: 1rem 2rem;
          background: transparent;
          border: 1px solid var(--border);
          color: white; border-radius: 0.625rem;
          font-size: 1rem; font-weight: 500;
          cursor: pointer; text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.3s ease;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .btn-secondary:hover {
          border-color: rgba(201,168,76,0.4);
          background: rgba(201,168,76,0.05);
          color: black; border-radius: 0.625rem;
        }

        /* ── Floating cards preview ── */
        .hero-preview {
          margin-top: 5rem; position: relative;
          width: 100%; max-width: 860px;
          opacity: 0; animation: fadeUp 1s ease 1s forwards;
        }
        .preview-card {
          background: rgba(13,13,26,0.9);
          border: 1px solid var(--border);
          border-radius: 1.25rem;
          padding: 1.5rem 2rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .preview-bar {
          display: flex; gap: 0.4rem; margin-bottom: 1.5rem;
        }
        .preview-dot {
          width: 10px; height: 10px; border-radius: 50%;
        }
        .preview-messages { display: flex; flex-direction: column; gap: 1rem; }
        .preview-msg-ai {
          display: flex; align-items: flex-start; gap: 0.75rem; text-align: left;
        }
        .preview-avatar {
          width: 2rem; height: 2rem; border-radius: 0.5rem; flex-shrink: 0;
          background: linear-gradient(135deg, var(--gold), var(--gold2));
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; color: #0a0808;
        }
        .preview-bubble-ai {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 0 0.875rem 0.875rem 0.875rem;
          padding: 0.875rem 1.125rem;
          font-size: 0.9rem; color: var(--text); line-height: 1.6;
          max-width: 520px;
        }
        .preview-bubble-user {
          background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(240,192,96,0.1));
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 0.875rem 0 0.875rem 0.875rem;
          padding: 0.875rem 1.125rem;
          font-size: 0.9rem; color: var(--text); line-height: 1.6;
          margin-left: auto; max-width: 360px; text-align: left;
        }
        .preview-input {
          margin-top: 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.875rem;
          padding: 1rem 1.25rem;
          display: flex; align-items: center; gap: 0.75rem;
          color: var(--muted); font-size: 0.875rem;
        }
        .preview-send {
          margin-left: auto;
          width: 2rem; height: 2rem;
          background: linear-gradient(135deg, var(--gold), var(--gold2));
          border-radius: 0.5rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; color: #0a0808; flex-shrink: 0;
        }

        /* ── Stats ── */
        .stats {
          display: flex; justify-content: center; gap: 4rem;
          padding: 3rem 2rem;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .stat { text-align: center; }
        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem; font-weight: 700;
          background: linear-gradient(135deg, var(--gold), var(--gold2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-label { font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem; }

        /* ── Section ── */
        .section { padding: 7rem 2rem; max-width: 1100px; margin: 0 auto; }
        .section-label {
          font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 1rem; font-weight: 600;
        }
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 4vw, 3.25rem);
          font-weight: 700; line-height: 1.1;
          color: var(--text);
        }
        .section-sub {
          font-size: 1.0625rem; color: var(--muted);
          line-height: 1.7; max-width: 540px;
          margin-top: 1rem; font-weight: 300;
        }

        /* ── Features ── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem; margin-top: 4rem;
        }
        .feature-card {
          background: var(--dark2);
          border: 1px solid var(--border);
          border-radius: 1.25rem;
          padding: 2rem;
          transition: all 0.3s ease;
          position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover {
          border-color: rgba(201,168,76,0.3);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon {
          width: 3rem; height: 3rem;
          background: rgba(201,168,76,0.1);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 0.875rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.375rem; margin-bottom: 1.5rem;
        }
        .feature-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem; font-weight: 700;
          color: var(--text); margin-bottom: 0.625rem;
        }
        .feature-desc { font-size: 0.9375rem; color: var(--muted); line-height: 1.65; font-weight: 300; }

        /* ── How it works ── */
        .steps { display: flex; flex-direction: column; gap: 0; margin-top: 4rem; position: relative; }
        .steps::before {
          content: '';
          position: absolute; left: 1.875rem; top: 0; bottom: 0; width: 1px;
          background: linear-gradient(to bottom, transparent, var(--gold), var(--gold), transparent);
          opacity: 0.3;
        }
        .step { display: flex; gap: 2rem; padding: 2.5rem 0; position: relative; }
        .step-num {
          width: 3.75rem; height: 3.75rem; flex-shrink: 0;
          background: var(--dark3);
          border: 1px solid var(--border);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 1.125rem; font-weight: 700; color: var(--gold);
          position: relative; z-index: 1;
        }
        .step-content { padding-top: 0.75rem; }
        .step-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.375rem; font-weight: 700;
          color: var(--text); margin-bottom: 0.5rem;
        }
        .step-desc { font-size: 0.9375rem; color: var(--muted); line-height: 1.65; font-weight: 300; }

        /* ── Branches ── */
        .branches {
          display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem;
        }
        .branch-tag {
          padding: 0.5rem 1.125rem;
          border: 1px solid var(--border);
          border-radius: 2rem;
          font-size: 0.875rem; color: var(--muted);
          background: rgba(255,255,255,0.02);
          transition: all 0.2s ease; cursor: default;
        }
        .branch-tag:hover { border-color: rgba(201,168,76,0.4); color: var(--gold); background: rgba(201,168,76,0.05); }

        /* ── CTA ── */
        .cta-section {
          padding: 6rem 2rem;
          text-align: center;
          position: relative; overflow: hidden;
          border-top: 1px solid var(--border);
        }
        .cta-glow {
          position: absolute; top: 50%; left: 50%;
          width: 600px; height: 300px;
          background: radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 70%);
          transform: translate(-50%,-50%);
          pointer-events: none;
        }
        .cta-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 900; line-height: 1.05;
          color: var(--text); position: relative;
        }
        .cta-sub {
          font-size: 1.125rem; color: var(--muted);
          margin-top: 1.25rem; position: relative;
          font-weight: 300;
        }
        .cta-actions { margin-top: 2.5rem; display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; position: relative; }

        /* ── Footer ── */
        .footer {
          padding: 2rem 3rem;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
          font-size: 0.875rem; color: var(--muted);
        }
        .footer-logo {
          font-family: 'Playfair Display', serif;
          color: var(--text); font-weight: 700;
        }
        .footer-links { display: flex; gap: 1.5rem; }
        .footer-link { color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: var(--gold); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .nav { padding: 1rem 1.5rem; }
          .nav-links { display: none; }
          .stats { gap: 2rem; }
          .steps::before { left: 1.5rem; }
          .footer { flex-direction: column; text-align: center; }
          .hero-preview { display: none; }

          
  .how-it-works-grid {
    grid-template-columns: 1fr !important;
    gap: 2rem !important;
  }
  .steps::before { left: 1.5rem; }
        }
      `}</style>

      {/* Cursor glow */}
      <div
        className="cursor-glow"
        style={{ left: mousePos.x, top: mousePos.y }}
      />

      {/* Navbar */}
      <nav className={`nav ${scrollY > 40 ? "scrolled" : ""}`}>
        <Link href="/" className="nav-logo">
          <div className="nav-logo-badge">⚡</div>
          GTU AI
        </Link>
        <div className="nav-links">
          <Link href="#features" className="nav-link">
            Features
          </Link>
          <Link href="#how-it-works" className="nav-link">
            How it works
          </Link>
          <Link href="/pricing" className="nav-link">
            Pricing
          </Link>
          {session?.user?.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="nav-link"
              style={{ color: "#c9a84c" }}
            >
              ⚙️ Dashboard
            </Link>
          )}
        </div>
        <Link href={session ? "/chat" : "/signin"} className="nav-cta">
          {session ? "Open Chat →" : "Get Started"}
        </Link>
      </nav>

      {/* Hero */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg" />
        <div className="hero-grid" />

        <div className="hero-badge">
          <div className="hero-badge-dot" />
          Built for GTU Students · Powered by AI
        </div>

        <h1 className="hero-title">
          Study Smarter.
          <br />
          <span className="hero-title-accent">Rank Higher.</span>
        </h1>

        <p className="hero-sub">
          Your AI study companion trained on GTU syllabus, past papers, and
          textbooks. Get instant answers, generate question papers, and ace your
          exams.
        </p>

        <div className="hero-actions">
          <Link href={session ? "/chat" : "/signup"} className="btn-primary">
            ⚡ Start Studying Free
          </Link>
          <Link href="#how-it-works" className="btn-secondary">
            See how it works ↓
          </Link>
        </div>

        {/* Chat preview */}
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-bar">
              <div className="preview-dot" style={{ background: "#ff5f57" }} />
              <div className="preview-dot" style={{ background: "#febc2e" }} />
              <div className="preview-dot" style={{ background: "#28c840" }} />
            </div>
            <div className="preview-messages">
              <div className="preview-bubble-user">
                What are the important topics from Control Theory for GTU exam?
              </div>
              <div className="preview-msg-ai">
                <div className="preview-avatar">AI</div>
                <div className="preview-bubble-ai">
                  Based on the last 5 years of GTU papers, the most frequently
                  asked topics are:
                  <strong
                    style={{
                      color: "#c9a84c",
                      display: "block",
                      marginTop: "0.5rem",
                    }}
                  >
                    1. Transfer Functions &amp; State Space Models (every year)
                    <br />
                    2. Root Locus &amp; Bode Plot (7-mark questions)
                    <br />
                    3. PID Controllers — design &amp; tuning
                  </strong>
                  <span
                    style={{
                      color: "#7a7a9a",
                      fontSize: "0.85rem",
                      display: "block",
                      marginTop: "0.5rem",
                    }}
                  >
                    📎 Source: Control Theory PYQ 2020–2025
                  </span>
                </div>
              </div>
            </div>
            <div className="preview-input">
              <span>Ask anything about your GTU subjects...</span>
              <div className="preview-send">→</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats">
        {[
          { num: "6+", label: "Engineering Branches" },
          { num: "8", label: "Semesters Covered" },
          { num: "100%", label: "GTU Syllabus" },
          { num: "24/7", label: "Available" },
        ].map((s, i) => (
          <div key={i} className="stat">
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section id="features" style={{ padding: "7rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div data-reveal="features" style={revealed("features")}>
            <div className="section-label">What you get</div>
            <h2 className="section-title">
              Everything you need
              <br />
              to top your semester
            </h2>
            <p className="section-sub">
              One platform for all your GTU exam preparation — from past papers
              to AI-generated mock tests.
            </p>
          </div>
          <div
            className="features-grid"
            data-reveal="features-grid"
            style={revealed("features-grid", 0.2)}
          >
            {[
              {
                icon: "🎯",
                title: "RAG-Powered Answers",
                desc: "AI searches through your actual GTU study material, textbooks, and past papers to give context-aware answers — not generic responses.",
              },
              {
                icon: "📝",
                title: "Generate Question Papers",
                desc: "Instantly create GTU-pattern mock papers with MCQs, short answers, and 7-mark questions. Ranker plan includes model answers.",
              },
              {
                icon: "📚",
                title: "GTU Resources Library",
                desc: "Access PYQs, notes, reference books, and study material organized by branch, semester, and subject — all in one place.",
              },
              {
                icon: "⚡",
                title: "Instant AI Chat",
                desc: "Ask anything — concept explanations, formula derivations, diagram descriptions, or exam strategies. Get answers in seconds.",
              },
              {
                icon: "🏆",
                title: "Smart Study Analysis",
                desc: "AI analyzes past 5 years of GTU papers to identify high-frequency topics and predict what's likely to appear in your exam.",
              },
              {
                icon: "🔒",
                title: "Secure & Private",
                desc: "Your study sessions are private. Email OTP verification, JWT sessions, and no data sharing with third parties.",
              },
            ].map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        style={{ padding: "7rem 2rem", borderTop: "1px solid var(--border)" }}
      >
        <div
          className="how-it-works-grid"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6rem",
            alignItems: "start",
          }}
        >
          <div data-reveal="steps" style={revealed("steps")}>
            <div className="section-label">How it works</div>
            <h2 className="section-title">
              From signup to
              <br />
              top ranker in 3 steps
            </h2>
            <p className="section-sub">
              No setup needed. Start asking questions about your GTU subjects
              immediately.
            </p>

            <div className="branches" style={{ marginTop: "2.5rem" }}>
              {[
                "Computer Eng.",
                "IT",
                "Electronics",
                "Mechanical",
                "Civil",
                "IC",
              ].map((b) => (
                <span key={b} className="branch-tag">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div
            className="steps"
            data-reveal="steps-list"
            style={revealed("steps-list", 0.2)}
          >
            {[
              {
                n: "01",
                title: "Sign up free",
                desc: "Create your account with email OTP verification. No credit card required — start with 15 free messages.",
              },
              {
                n: "02",
                title: "Ask your question",
                desc: "Type any question about your GTU subject. The AI searches through uploaded study material to give accurate, syllabus-aligned answers.",
              },
              {
                n: "03",
                title: "Ace your exams",
                desc: "Use generated question papers to practice, identify weak topics, and study efficiently with AI-guided preparation.",
              },
            ].map((s, i) => (
              <div key={i} className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-content">
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="cta-section"
        data-reveal="cta"
        style={revealed("cta")}
      >
        <div className="cta-glow" />
        <p className="section-label">Ready to start?</p>
        <h2 className="cta-title">
          Your GTU rank
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #c9a84c, #f0c060)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            starts here.
          </span>
        </h2>
        <p className="cta-sub">
          Join students already using GTU AI to study smarter.
          <br />
          First 15 messages are completely free.
        </p>
        <div className="cta-actions">
          <Link
            href={session ? "/chat" : "/signup"}
            className="btn-primary"
            style={{ fontSize: "1.0625rem", padding: "1.125rem 3rem" }}
          >
            ⚡ {session ? "Continue Studying" : "Start for Free"}
          </Link>
          <Link href="/pricing" className="btn-secondary">
            View pricing →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">GTU AI ⚡</div>
        <div style={{ fontSize: "0.8125rem" }}>
          Made for GTU students · Not affiliated with GTU officially
        </div>
        <div className="footer-links">
          <Link href="/pricing" className="footer-link">
            Pricing
          </Link>
          <Link href="/chat" className="footer-link">
            Chat
          </Link>
          <Link href="/gtu" className="footer-link">
            Resources
          </Link>
          <Link href="/signin" className="footer-link">
            Sign In
          </Link>
        </div>
      </footer>
    </>
  );
}
