'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const BRANCHES = [
  { id: 'ce',    name: 'Computer Engineering',       icon: '💻' },
  { id: 'it',    name: 'Information Technology',     icon: '🌐' },
  { id: 'ec',    name: 'Electronics & Communication',icon: '📡' },
  { id: 'ic',    name: 'Instrumentation & Control',  icon: '🎛️' },
  { id: 'me',    name: 'Mechanical Engineering',     icon: '⚙️' },
  { id: 'civil', name: 'Civil Engineering',          icon: '🏗️' },
];

const YEARS = ['2024-25','2023-24','2022-23','2021-22','2020-21'];

const SECTIONS = [
  {
    id: 'pyq',
    title: 'Previous Year Questions',
    shortTitle: 'PYQ',
    icon: '📝',
    description: 'Access GTU exam papers from previous years',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    bg: '#f5f3ff',
    border: '#e0e7ff',
    available: true,
  },
  {
    id: 'books',
    title: 'Reference Books',
    shortTitle: 'Books',
    icon: '📚',
    description: 'Textbooks and reference materials',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    bg: '#f0f9ff',
    border: '#bae6fd',
    available: true,
  },
  {
    id: 'notes',
    title: 'Lecture Notes',
    shortTitle: 'Notes',
    icon: '🗒️',
    description: 'Professor and student notes',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    bg: '#f0fdf4',
    border: '#a7f3d0',
    available: true,
  },
  {
    id: 'syllabus',
    title: 'Syllabus',
    shortTitle: 'Syllabus',
    icon: '📋',
    description: 'GTU official syllabus documents',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    bg: '#fffbeb',
    border: '#fde68a',
    available: false,
    comingSoon: true,
  },
  {
    id: 'lab',
    title: 'Lab Manuals',
    shortTitle: 'Lab',
    icon: '🔬',
    description: 'Practical and lab experiment guides',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    bg: '#faf5ff',
    border: '#ddd6fe',
    available: false,
    comingSoon: true,
  },
  {
    id: 'solutions',
    title: 'Solutions Manual',
    shortTitle: 'Solutions',
    icon: '✅',
    description: 'Detailed solutions to past papers',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
    bg: '#fef2f2',
    border: '#fecaca',
    available: false,
    comingSoon: true,
  },
];

// ─── DOCUMENT CARD ────────────────────────────────────────────────────────────
function DocCard({ doc, section }) {
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    setOpening(true);
    window.open(`/api/gtu/view/${doc._id}`, '_blank');
    setTimeout(() => setOpening(false), 2000);
  };

  const branchName = BRANCHES.find(b => b.id === doc.branch)?.name || doc.branch;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '1rem',
      padding: '1.25rem',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.875rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.1)`;
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.borderColor = section.color;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.borderColor = '#e5e7eb';
    }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          borderRadius: '0.75rem',
          background: section.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          flexShrink: 0,
          border: `1px solid ${section.border}`
        }}>
          {section.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '0.9375rem',
            fontWeight: '700',
            color: '#111827',
            lineHeight: '1.4',
            marginBottom: '0.25rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {doc.title}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
            {doc.subject}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        <span style={tag('#f5f3ff', section.color)}>{branchName}</span>
        <span style={tag('#f0fdf4', '#10b981')}>Sem {doc.semester}</span>
        {doc.academicYear && (
          <span style={tag('#fffbeb', '#f59e0b')}>{doc.academicYear}</span>
        )}
        {doc.author && (
          <span style={tag('#f9fafb', '#6b7280')}>{doc.author}</span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : 'PDF'}
          {doc.views ? ` · ${doc.views} views` : ''}
        </div>
        <button
          onClick={handleOpen}
          disabled={opening}
          style={{
            padding: '0.5rem 1rem',
            background: opening ? '#e5e7eb' : section.gradient,
            color: opening ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: opening ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'all 0.2s ease'
          }}
        >
          <svg style={{ width: '0.875rem', height: '0.875rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {opening ? 'Opening...' : 'View PDF'}
        </button>
      </div>
    </div>
  );
}

// ─── PYQ / BOOKS BROWSER ──────────────────────────────────────────────────────
function ResourceBrowser({ section, onBack }) {
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [filters, setFilters]     = useState({
    branch: '', semester: '', subject: '', year: '', search: ''
  });

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const fetchDocs = async (f = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: section.id });
      if (f.branch)   params.set('branch',   f.branch);
      if (f.semester) params.set('semester', f.semester);
      if (f.subject)  params.set('subject',  f.subject);
      if (f.year)     params.set('year',     f.year);
      if (f.search)   params.set('search',   f.search);

      const res  = await fetch(`/api/gtu/resources?${params}`);
      const data = await res.json();
      if (data.success) setDocs(data.documents || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleSearch = () => fetchDocs(filters);
  const handleReset  = () => {
    const reset = { branch: '', semester: '', subject: '', year: '', search: '' };
    setFilters(reset);
    fetchDocs(reset);
  };

  const inpStyle = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.75rem',
    fontSize: '0.875rem',
    color: '#111827',
    background: 'white',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box'
  };

  return (
    <div>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 0.875rem',
            background: 'white', border: '2px solid #e5e7eb',
            borderRadius: '0.75rem', fontSize: '0.875rem',
            fontWeight: '600', color: '#374151', cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = section.color; e.currentTarget.style.color = section.color; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
        >
          <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div>
          <h2 style={{ fontSize: '1.375rem', fontWeight: '800', color: '#111827' }}>
            {section.icon} {section.title}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{section.description}</p>
        </div>
      </div>

      {/* Filter Card */}
      <div style={{
        background: 'white',
        border: `1px solid ${section.border}`,
        borderRadius: '1.25rem',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
          🔍 Search & Filter
        </h3>

        {/* Search bar */}
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg style={{ width: '1.125rem', height: '1.125rem', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by title, subject, author..."
            value={filters.search}
            onChange={e => setF('search', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ ...inpStyle, paddingLeft: '2.75rem' }}
            onFocus={e => e.currentTarget.style.borderColor = section.color}
            onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* Branch */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '0.375rem' }}>Branch</label>
            <select
              value={filters.branch}
              onChange={e => setF('branch', e.target.value)}
              style={{ ...inpStyle, cursor: 'pointer' }}
              onFocus={e => e.currentTarget.style.borderColor = section.color}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="">All Branches</option>
              {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '0.375rem' }}>Semester</label>
            <select
              value={filters.semester}
              onChange={e => setF('semester', e.target.value)}
              style={{ ...inpStyle, cursor: 'pointer' }}
              onFocus={e => e.currentTarget.style.borderColor = section.color}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '0.375rem' }}>Subject</label>
            <input
              type="text"
              placeholder="e.g., Control Theory"
              value={filters.subject}
              onChange={e => setF('subject', e.target.value)}
              style={inpStyle}
              onFocus={e => e.currentTarget.style.borderColor = section.color}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Year */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '0.375rem' }}>Academic Year</label>
            <select
              value={filters.year}
              onChange={e => setF('year', e.target.value)}
              style={{ ...inpStyle, cursor: 'pointer' }}
              onFocus={e => e.currentTarget.style.borderColor = section.color}
              onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
            >
              <option value="">All Years</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleSearch}
            style={{
              padding: '0.625rem 1.5rem',
              background: section.gradient,
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              boxShadow: `0 4px 10px ${section.color}30`,
              transition: 'all 0.2s ease'
            }}
          >
            <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'white',
              color: '#6b7280',
              border: '2px solid #e5e7eb',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '3rem', height: '3rem',
            border: '3px solid #f3f4f6',
            borderTop: `3px solid ${section.color}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>Loading {section.shortTitle}s...</p>
        </div>
      ) : docs.length > 0 ? (
        <>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#6b7280',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              padding: '0.25rem 0.625rem',
              background: section.bg,
              color: section.color,
              borderRadius: '2rem',
              fontWeight: '700'
            }}>{docs.length}</span>
            {section.shortTitle}{docs.length !== 1 ? 's' : ''} found
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {docs.map(doc => (
              <DocCard key={doc._id} doc={doc} section={section} />
            ))}
          </div>
        </>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '1.25rem',
          border: '2px dashed #e5e7eb'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{section.icon}</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            No {section.title} found
          </h3>
          <p style={{ fontSize: '0.9375rem', color: '#6b7280' }}>
            {(filters.branch || filters.semester || filters.subject || filters.search)
              ? 'Try different filters or search terms'
              : 'No documents uploaded yet. Admin will add them soon.'}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── MAIN GTU PAGE ────────────────────────────────────────────────────────────
function GTUContent() {
  const [activeSection, setActiveSection] = useState(null);

  const section = SECTIONS.find(s => s.id === activeSection);

  if (activeSection && section?.available) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8faff', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <ResourceBrowser section={section} onBack={() => setActiveSection(null)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8faff 0%, #f5f3ff 50%, #faf5ff 100%)',
      padding: '2.5rem 1rem'
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />

      <div style={{ maxWidth: '64rem', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '4.5rem', height: '4.5rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
            borderRadius: '1.25rem', marginBottom: '1.25rem',
            boxShadow: '0 12px 30px -5px rgba(99,102,241,0.4)'
          }}>
            <svg style={{ width: '2.25rem', height: '2.25rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
            fontWeight: '900',
            color: '#111827',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em'
          }}>
            GTU Resources
          </h1>
          <p style={{ fontSize: '1.0625rem', color: '#6b7280', maxWidth: '36rem', margin: '0 auto', lineHeight: '1.6' }}>
            Access all GTU study materials — previous year questions, books, notes, and more.
          </p>
        </div>

        {/* Stats bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '3rem',
          flexWrap: 'wrap'
        }}>
          {[
            { label: 'Branches', value: '6', icon: '🏫' },
            { label: 'Semesters', value: '8', icon: '📅' },
            { label: 'Resources', value: '∞', icon: '📚' },
            { label: 'Free Forever', value: '100%', icon: '🆓' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827' }}>{stat.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: '500' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Section Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          {SECTIONS.map((sec, i) => (
            <button
              key={sec.id}
              onClick={() => sec.available && setActiveSection(sec.id)}
              disabled={!sec.available}
              style={{
                background: 'white',
                border: `2px solid ${sec.border}`,
                borderRadius: '1.25rem',
                padding: '1.75rem',
                textAlign: 'left',
                cursor: sec.available ? 'pointer' : 'default',
                transition: 'all 0.25s ease',
                opacity: sec.available ? 1 : 0.7,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                animationDelay: `${i * 0.05}s`
              }}
              onMouseEnter={e => {
                if (sec.available) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 16px 32px ${sec.color}20`;
                  e.currentTarget.style.borderColor = sec.color;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                e.currentTarget.style.borderColor = sec.border;
              }}
            >
              {/* Decorative circle */}
              <div style={{
                position: 'absolute', top: '-1.5rem', right: '-1.5rem',
                width: '7rem', height: '7rem',
                background: sec.bg,
                borderRadius: '50%',
                opacity: 0.7
              }} />

              {/* Coming Soon badge */}
              {sec.comingSoon && (
                <div style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  padding: '0.25rem 0.625rem',
                  background: '#fef3c7',
                  color: '#d97706',
                  borderRadius: '2rem',
                  fontSize: '0.6875rem',
                  fontWeight: '700',
                  letterSpacing: '0.05em'
                }}>
                  COMING SOON
                </div>
              )}

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Icon */}
                <div style={{
                  width: '3.5rem', height: '3.5rem',
                  background: sec.gradient,
                  borderRadius: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.75rem',
                  marginBottom: '1.125rem',
                  boxShadow: `0 6px 15px ${sec.color}30`
                }}>
                  {sec.icon}
                </div>

                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '800',
                  color: '#111827',
                  marginBottom: '0.5rem'
                }}>
                  {sec.title}
                </h3>

                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  marginBottom: '1.25rem'
                }}>
                  {sec.description}
                </p>

                {sec.available && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    color: sec.color
                  }}>
                    Browse {sec.shortTitle}
                    <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Bottom note */}
        <div style={{
          marginTop: '3rem',
          padding: '1.25rem 1.5rem',
          background: 'white',
          borderRadius: '1rem',
          border: '1px solid #e0e7ff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          <div style={{
            width: '2.5rem', height: '2.5rem',
            background: '#f5f3ff', borderRadius: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', flexShrink: 0
          }}>
            💡
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#111827', marginBottom: '0.25rem' }}>
              Can't find what you need?
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Ask GTU AI — just type your question in the chat and it will search all uploaded materials for you.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GTUPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem', height: '3rem',
            border: '3px solid #e5e7eb', borderTop: '3px solid #6366f1',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading resources...</p>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      </div>
    }>
      <GTUContent />
    </Suspense>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function tag(bg, color) {
  return {
    display: 'inline-flex', alignItems: 'center',
    padding: '0.25rem 0.625rem',
    background: bg, color,
    borderRadius: '2rem',
    fontSize: '0.6875rem',
    fontWeight: '700',
    whiteSpace: 'nowrap'
  };
}