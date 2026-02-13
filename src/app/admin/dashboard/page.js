'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const BRANCHES = [
  { id: 'ce',    name: 'Computer Engineering' },
  { id: 'it',    name: 'Information Technology' },
  { id: 'ec',    name: 'Electronics & Communication' },
  { id: 'ic',    name: 'Instrumentation & Control' },
  { id: 'me',    name: 'Mechanical Engineering' },
  { id: 'civil', name: 'Civil Engineering' },
];

const TYPE_COLORS = {
  notes:     { color: '#10b981', bg: '#f0fdf4', label: 'Notes' },
  book:      { color: '#0ea5e9', bg: '#f0f9ff', label: 'Book' },
  reference: { color: '#8b5cf6', bg: '#faf5ff', label: 'Reference' },
  pyq:       { color: '#6366f1', bg: '#f5f3ff', label: 'PYQ' },
};

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab]     = useState('upload');
  const [uploading, setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Documents tab state
  const [documents, setDocuments]     = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [deleting, setDeleting]       = useState(null);
  const [docFilter, setDocFilter]     = useState({ type: '', branch: '', semester: '' });

  const [form, setForm] = useState({
    title: '', type: 'notes', branch: '', semester: '',
    subject: '', academicYear: '2024-25', author: '', file: null,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Fetch documents ──────────────────────────────────────────────────────────
  const fetchDocuments = async (filters = docFilter) => {
    setDocsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type)     params.set('type',     filters.type);
      if (filters.branch)   params.set('branch',   filters.branch);
      if (filters.semester) params.set('semester', filters.semester);

      const res  = await fetch(`/api/admin/documents?${params}`);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch {
        toast.error('Failed to parse response');
        return;
      }
      if (data.success) {
        setDocuments(data.documents || []);
      } else {
        toast.error(data.error || 'Failed to load documents');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments();
  }, [activeTab]);

  // ── Delete document ──────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setDeleting(id);
    try {
      const res  = await fetch('/api/admin/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Document deleted');
        setDocuments(p => p.filter(d => d._id !== id));
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  // ── Upload ───────────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      e.target.value = '';
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File must be under 50MB');
      e.target.value = '';
      return;
    }
    set('file', file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title.trim())   { toast.error('Enter document title');  return; }
    if (!form.branch)         { toast.error('Select a branch');       return; }
    if (!form.semester)       { toast.error('Select a semester');     return; }
    if (!form.subject.trim()) { toast.error('Enter subject name');    return; }
    if (!form.file)           { toast.error('Select a PDF file');     return; }

    setUploading(true);
    setUploadProgress(10);

    try {
      const fd = new FormData();
      fd.append('title',        form.title.trim());
      fd.append('type',         form.type);
      fd.append('branch',       form.branch);
      fd.append('semester',     String(form.semester));
      fd.append('subject',      form.subject.trim());
      fd.append('academicYear', form.academicYear);
      fd.append('author',       form.author.trim());
      fd.append('file',         form.file);

      const interval = setInterval(() => setUploadProgress(p => Math.min(p + 8, 88)), 400);
      const res  = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      clearInterval(interval);
      setUploadProgress(100);

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch {
        toast.error('Server error — check terminal');
        return;
      }

      if (data.success) {
        toast.success('✅ Uploaded successfully!');
        setForm({ title: '', type: 'notes', branch: '', semester: '', subject: '', academicYear: '2024-25', author: '', file: null });
        const fi = document.getElementById('file-input');
        if (fi) fi.value = '';
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1500);
    }
  };

  const inp = {
    width: '100%', padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb', borderRadius: '0.75rem',
    fontSize: '0.9375rem', color: '#111827',
    background: 'white', outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.2s ease', boxSizing: 'border-box'
  };

  const tabs = [
    { id: 'upload',    label: 'Upload',   icon: '📤' },
    { id: 'documents', label: 'Manage',   icon: '📁' },
    { id: 'stats',     label: 'Stats',    icon: '📊' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8faff', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: '#111827', marginBottom: '0.25rem' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#6b7280' }}>Signed in as <strong>{session?.user?.email}</strong></p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
          background: 'white', padding: '0.375rem', borderRadius: '0.875rem',
          border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              flex: 1, padding: '0.625rem 0.75rem',
              background: activeTab === t.id ? 'linear-gradient(135deg,#6366f1 0%,#9333ea 100%)' : 'transparent',
              color: activeTab === t.id ? 'white' : '#6b7280',
              border: 'none', borderRadius: '0.625rem',
              fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
            }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── UPLOAD TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div style={{ background: 'white', borderRadius: '1.25rem', padding: '2rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827', marginBottom: '1.75rem' }}>
              Upload Study Material
            </h2>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div>
                <label style={lbl}>Document Title *</label>
                <input type="text" placeholder="e.g., Control Theory PYQ Winter 2025"
                  value={form.title} onChange={e => set('title', e.target.value)}
                  style={inp} onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
              </div>

              <div>
                <label style={lbl}>Document Type *</label>
                <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                  {['notes','book','reference','pyq'].map(t => (
                    <button key={t} type="button" onClick={() => set('type', t)} style={{
                      padding: '0.5rem 1.25rem',
                      border: `2px solid ${form.type === t ? '#6366f1' : '#e5e7eb'}`,
                      borderRadius: '2rem',
                      background: form.type === t ? '#f5f3ff' : 'white',
                      color: form.type === t ? '#6366f1' : '#374151',
                      fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer',
                      textTransform: 'capitalize', transition: 'all 0.2s ease'
                    }}>
                      {t === 'pyq' ? 'PYQ' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Branch *</label>
                  <select value={form.branch} onChange={e => set('branch', e.target.value)}
                    style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                    <option value="">Select Branch</option>
                    {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Semester *</label>
                  <select value={form.semester} onChange={e => set('semester', e.target.value)}
                    style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={lbl}>Subject *</label>
                  <input type="text" placeholder="e.g., Control Theory"
                    value={form.subject} onChange={e => set('subject', e.target.value)}
                    style={inp} onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
                </div>
                <div>
                  <label style={lbl}>Academic Year</label>
                  <select value={form.academicYear} onChange={e => set('academicYear', e.target.value)}
                    style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                    {['2024-25','2023-24','2022-23','2021-22'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>Author / Publisher (optional)</label>
                <input type="text" placeholder="e.g., GTU / Prof. John Doe"
                  value={form.author} onChange={e => set('author', e.target.value)}
                  style={inp} onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'} />
              </div>

              {/* File Drop Zone */}
              <div>
                <label style={lbl}>PDF File * (max 50MB)</label>
                <label htmlFor="file-input" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '2rem',
                  border: `2px dashed ${form.file ? '#6366f1' : '#d1d5db'}`,
                  borderRadius: '1rem',
                  background: form.file ? '#f5f3ff' : '#fafafa',
                  cursor: 'pointer', transition: 'all 0.2s ease', gap: '0.75rem'
                }}>
                  {form.file ? (
                    <>
                      <div style={{ width:'3rem',height:'3rem',background:'linear-gradient(135deg,#6366f1,#9333ea)',borderRadius:'0.75rem',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <svg style={{ width:'1.5rem',height:'1.5rem',color:'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'0.9375rem',fontWeight:'600',color:'#6366f1' }}>{form.file.name}</div>
                        <div style={{ fontSize:'0.8125rem',color:'#6b7280' }}>{(form.file.size/1024/1024).toFixed(2)} MB</div>
                      </div>
                      <button type="button" onClick={e => { e.preventDefault(); set('file',null); const fi=document.getElementById('file-input'); if(fi)fi.value=''; }}
                        style={{ fontSize:'0.8125rem',color:'#ef4444',background:'none',border:'none',cursor:'pointer',textDecoration:'underline' }}>
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ width:'3rem',height:'3rem',background:'#f3f4f6',borderRadius:'0.75rem',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <svg style={{ width:'1.5rem',height:'1.5rem',color:'#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'0.9375rem',fontWeight:'600',color:'#374151' }}>Click to upload PDF</div>
                        <div style={{ fontSize:'0.8125rem',color:'#9ca3af' }}>PDF up to 50MB</div>
                      </div>
                    </>
                  )}
                  <input id="file-input" type="file" accept=".pdf,application/pdf" onChange={handleFileChange} style={{ display:'none' }} />
                </label>
              </div>

              {uploading && (
                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'0.5rem' }}>
                    <span style={{ fontSize:'0.875rem',fontWeight:'600',color:'#374151' }}>Uploading...</span>
                    <span style={{ fontSize:'0.875rem',fontWeight:'700',color:'#6366f1' }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ height:'8px',background:'#f3f4f6',borderRadius:'4px',overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${uploadProgress}%`,background:'linear-gradient(90deg,#6366f1,#9333ea)',borderRadius:'4px',transition:'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              <button type="submit" disabled={uploading} style={{
                width:'100%', padding:'0.9375rem',
                background: uploading ? '#e5e7eb' : 'linear-gradient(135deg,#6366f1,#9333ea)',
                color: uploading ? '#9ca3af' : 'white',
                border:'none', borderRadius:'0.875rem', fontSize:'1rem',
                fontWeight:'700', cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: uploading ? 'none' : '0 4px 15px rgba(99,102,241,0.3)',
                transition:'all 0.2s ease',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginTop:'0.5rem'
              }}>
                {uploading ? (
                  <><svg style={{ width:'1.25rem',height:'1.25rem',animation:'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity:0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity:0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>Uploading...</>
                ) : (
                  <><svg style={{ width:'1.25rem',height:'1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>Upload Document</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── MANAGE DOCUMENTS TAB ────────────────────────────────────────── */}
        {activeTab === 'documents' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

            {/* Filter bar */}
            <div style={{ background:'white',borderRadius:'1rem',padding:'1.25rem',border:'1px solid #e5e7eb',display:'flex',gap:'0.75rem',flexWrap:'wrap',alignItems:'flex-end' }}>
              <div style={{ flex:1, minWidth:'140px' }}>
                <label style={lbl}>Type</label>
                <select value={docFilter.type} onChange={e => setDocFilter(p => ({...p,type:e.target.value}))}
                  style={{ ...inp, padding:'0.625rem 0.875rem', fontSize:'0.875rem', cursor:'pointer' }}>
                  <option value="">All Types</option>
                  <option value="pyq">PYQ</option>
                  <option value="notes">Notes</option>
                  <option value="book">Book</option>
                  <option value="reference">Reference</option>
                </select>
              </div>
              <div style={{ flex:1, minWidth:'140px' }}>
                <label style={lbl}>Branch</label>
                <select value={docFilter.branch} onChange={e => setDocFilter(p => ({...p,branch:e.target.value}))}
                  style={{ ...inp, padding:'0.625rem 0.875rem', fontSize:'0.875rem', cursor:'pointer' }}>
                  <option value="">All Branches</option>
                  {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ flex:1, minWidth:'120px' }}>
                <label style={lbl}>Semester</label>
                <select value={docFilter.semester} onChange={e => setDocFilter(p => ({...p,semester:e.target.value}))}
                  style={{ ...inp, padding:'0.625rem 0.875rem', fontSize:'0.875rem', cursor:'pointer' }}>
                  <option value="">All</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
              <button onClick={() => fetchDocuments(docFilter)} style={{
                padding:'0.625rem 1.25rem',
                background:'linear-gradient(135deg,#6366f1,#9333ea)',
                color:'white', border:'none', borderRadius:'0.75rem',
                fontSize:'0.875rem', fontWeight:'700', cursor:'pointer',
                whiteSpace:'nowrap', height:'fit-content'
              }}>
                Apply Filters
              </button>
            </div>

            {/* Document List */}
            {docsLoading ? (
              <div style={{ textAlign:'center', padding:'3rem', background:'white', borderRadius:'1rem', border:'1px solid #e5e7eb' }}>
                <div style={{ width:'3rem',height:'3rem',border:'3px solid #f3f4f6',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 1rem' }} />
                <p style={{ color:'#6b7280' }}>Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div style={{ textAlign:'center', padding:'3rem', background:'white', borderRadius:'1rem', border:'2px dashed #e5e7eb' }}>
                <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📁</div>
                <p style={{ fontWeight:'600', color:'#111827', marginBottom:'0.5rem' }}>No documents found</p>
                <p style={{ fontSize:'0.875rem', color:'#6b7280' }}>Upload documents from the Upload tab</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize:'0.875rem', fontWeight:'600', color:'#6b7280', padding:'0 0.25rem' }}>
                  {documents.length} document{documents.length !== 1 ? 's' : ''} found
                </div>
                {documents.map(doc => {
                  const tc = TYPE_COLORS[doc.type] || TYPE_COLORS.notes;
                  const branchName = BRANCHES.find(b => b.id === doc.branch)?.name || doc.branch;
                  return (
                    <div key={doc._id} style={{
                      background:'white', borderRadius:'1rem', padding:'1.25rem',
                      border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
                      display:'flex', alignItems:'center', gap:'1rem',
                      transition:'box-shadow 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
                    >
                      {/* Type badge */}
                      <div style={{
                        padding:'0.5rem 0.875rem', background:tc.bg, color:tc.color,
                        borderRadius:'0.75rem', fontSize:'0.75rem', fontWeight:'800',
                        letterSpacing:'0.05em', flexShrink:0
                      }}>
                        {tc.label}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'0.9375rem', fontWeight:'700', color:'#111827', marginBottom:'0.25rem',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize:'0.8125rem', color:'#6b7280', display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                          <span>{doc.subject}</span>
                          <span>·</span>
                          <span>{branchName}</span>
                          <span>·</span>
                          <span>Sem {doc.semester}</span>
                          {doc.academicYear && <><span>·</span><span>{doc.academicYear}</span></>}
                          {doc.fileSize && <><span>·</span><span>{(doc.fileSize/1024/1024).toFixed(1)} MB</span></>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
                        <button onClick={() => window.open(`/api/gtu/view/${doc._id}`, '_blank')} style={{
                          padding:'0.5rem 0.875rem', background:'#f5f3ff', color:'#6366f1',
                          border:'none', borderRadius:'0.625rem', fontSize:'0.8125rem',
                          fontWeight:'600', cursor:'pointer', transition:'all 0.2s ease'
                        }}>
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          disabled={deleting === doc._id}
                          style={{
                            padding:'0.5rem 0.875rem',
                            background: deleting === doc._id ? '#f3f4f6' : '#fef2f2',
                            color: deleting === doc._id ? '#9ca3af' : '#ef4444',
                            border:'none', borderRadius:'0.625rem', fontSize:'0.8125rem',
                            fontWeight:'600', cursor: deleting === doc._id ? 'not-allowed' : 'pointer',
                            transition:'all 0.2s ease'
                          }}
                        >
                          {deleting === doc._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ── STATS TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'1rem' }}>
            {[
              { label:'Total Documents', value: documents.length || '—', icon:'📄', color:'#6366f1' },
              { label:'PYQs',            value: documents.filter(d=>d.type==='pyq').length || '—', icon:'📝', color:'#0ea5e9' },
              { label:'Notes',           value: documents.filter(d=>d.type==='notes').length || '—', icon:'🗒️', color:'#10b981' },
              { label:'Books',           value: documents.filter(d=>d.type==='book').length || '—', icon:'📚', color:'#f59e0b' },
            ].map((s, i) => (
              <div key={i} style={{ background:'white',borderRadius:'1rem',padding:'1.5rem',textAlign:'center',border:'1px solid #e5e7eb',boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize:'2rem',marginBottom:'0.75rem' }}>{s.icon}</div>
                <div style={{ fontSize:'1.75rem',fontWeight:'800',color:s.color }}>{s.value}</div>
                <div style={{ fontSize:'0.8125rem',color:'#6b7280',marginTop:'0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

const lbl = { display:'block', fontSize:'0.875rem', fontWeight:'600', color:'#374151', marginBottom:'0.5rem' };