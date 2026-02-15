'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// ─── BRANCH / SEMESTER / SUBJECT DATA ─────────────────────────────────────────
const BRANCHES = [
  {
    id: 'ce',
    name: 'Computer Engineering',
    shortName: 'CE',
    icon: '💻',
    color: '#6366f1',
    bg: '#f5f3ff'
  },
  {
    id: 'it',
    name: 'Information Technology',
    shortName: 'IT',
    icon: '🌐',
    color: '#0ea5e9',
    bg: '#f0f9ff'
  },
  {
    id: 'ec',
    name: 'Electronics & Communication',
    shortName: 'EC',
    icon: '📡',
    color: '#10b981',
    bg: '#f0fdf4'
  },
  {
    id: 'ic',
    name: 'Instrumentation & Control',
    shortName: 'IC',
    icon: '🎛️',
    color: '#f59e0b',
    bg: '#fffbeb'
  },
  {
    id: 'me',
    name: 'Mechanical Engineering',
    shortName: 'ME',
    icon: '⚙️',
    color: '#ef4444',
    bg: '#fef2f2'
  },
  {
    id: 'civil',
    name: 'Civil Engineering',
    shortName: 'CIVIL',
    icon: '🏗️',
    color: '#8b5cf6',
    bg: '#faf5ff'
  },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const SUBJECTS_MAP = {
  ce: {
    3: ['Data Structures', 'Digital Electronics', 'Computer Organization', 'Discrete Mathematics'],
    4: ['Analysis of Algorithms', 'Database Management', 'Operating Systems', 'Computer Networks'],
    5: ['Software Engineering', 'Compiler Design', 'Web Technology', 'Theory of Computation'],
    6: ['Artificial Intelligence', 'Machine Learning', 'Information Security', 'Mobile Computing'],
  },
  it: {
    3: ['Data Structures', 'Digital Electronics', 'Computer Organization', 'Discrete Mathematics'],
    4: ['Database Management', 'Operating Systems', 'Computer Networks', 'Java Programming'],
    5: ['Web Development', 'Software Engineering', 'Network Security', 'Linux Administration'],
    6: ['Cloud Computing', 'Big Data Analytics', 'IoT', 'Mobile App Development'],
  },
  ec: {
    3: ['Signals & Systems', 'Electronic Devices', 'Network Analysis', 'Digital Electronics'],
    4: ['Analog Circuits', 'Microprocessors', 'Communication Theory', 'Electromagnetic Fields'],
    5: ['Digital Communication', 'VLSI Design', 'Microcontrollers', 'Control Systems'],
    6: ['Wireless Communication', 'Embedded Systems', 'Optical Fiber', 'Signal Processing'],
  },
  ic: {
    3: ['Measurement Systems', 'Electronic Devices', 'Control Theory', 'Transducers'],
    4: ['Process Control', 'Industrial Instrumentation', 'PLC Programming', 'Signal Conditioning'],
    5: ['Advanced Control', 'Biomedical Instrumentation', 'DCS/SCADA', 'Sensors & Actuators'],
    6: ['Industrial Automation', 'Robotics', 'Embedded Control', 'Power Electronics'],
  },
  me: {
    3: ['Thermodynamics', 'Strength of Materials', 'Manufacturing Processes', 'Engineering Drawing'],
    4: ['Fluid Mechanics', 'Machine Design', 'Heat Transfer', 'Theory of Machines'],
    5: ['CAD/CAM', 'Refrigeration & AC', 'Industrial Engineering', 'Metrology'],
    6: ['Automobile Engineering', 'Robotics', 'Tribology', 'Power Plant Engineering'],
  },
  civil: {
    3: ['Structural Analysis', 'Fluid Mechanics', 'Geotechnical Engineering', 'Surveying'],
    4: ['RCC Design', 'Transportation Engineering', 'Hydrology', 'Environmental Engineering'],
    5: ['Foundation Engineering', 'Steel Design', 'Water Supply', 'Town Planning'],
    6: ['Bridge Engineering', 'Earthquake Engineering', 'Remote Sensing', 'Quantity Surveying'],
  },
};

const QUESTION_TYPES = [
  { id: 'mcq', label: 'Multiple Choice', icon: '◉', description: '4 options, 1 correct' },
  { id: 'short', label: 'Short Answer', icon: '✎', description: '2-3 marks' },
  { id: 'long', label: 'Long Answer', icon: '≡', description: '5-7 marks' },
  { id: 'numerical', label: 'Numerical', icon: '#', description: 'Calculation based' },
];

const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy', color: '#10b981', bg: '#f0fdf4' },
  { id: 'medium', label: 'Medium', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'hard', label: 'Hard', color: '#ef4444', bg: '#fef2f2' },
  { id: 'mixed', label: 'Mixed', color: '#6366f1', bg: '#f5f3ff' },
];

// ─── STEP INDICATOR ─────────────────────────────────────────────────────────────
function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2.5rem' }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              background: i < current
                ? 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)'
                : i === current
                  ? 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)'
                  : '#f3f4f6',
              color: i <= current ? 'white' : '#9ca3af',
              boxShadow: i === current ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
            }}>
              {i < current ? (
                <svg style={{ width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (i + 1)}
            </div>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: '600',
              color: i <= current ? '#6366f1' : '#9ca3af',
              whiteSpace: 'nowrap',
              display: 'none'
            }} className="step-label">
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1,
              height: '2px',
              background: i < current
                ? 'linear-gradient(90deg, #6366f1 0%, #9333ea 100%)'
                : '#e5e7eb',
              margin: '0 0.5rem',
              transition: 'all 0.3s ease',
              marginBottom: '0.875rem'
            }} />
          )}
        </div>
      ))}
      <style jsx>{`
        @media (min-width: 640px) {
          .step-label { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ─── MAIN QPG PAGE ────────────────────────────────────────────────────────────
export default function QPGPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState(null);

  const [form, setForm] = useState({
    branch: null,
    semester: null,
    subject: null,
    questionTypes: [],
    difficulty: 'mixed',
    totalQuestions: 10,
    totalMarks: 70,
    examDuration: 180,
    instructions: '',
    includeAnswerKey: false,
  });

  const steps = ['Branch', 'Subject', 'Configuration', 'Generate'];

  const selectedBranch = BRANCHES.find(b => b.id === form.branch);
  const availableSubjects = form.branch && form.semester
    ? (SUBJECTS_MAP[form.branch]?.[form.semester] || [])
    : [];

  const canNext = () => {
    if (step === 0) return form.branch && form.semester;
    if (step === 1) return form.subject;
    if (step === 2) return form.questionTypes.length > 0 && form.difficulty;
    return false;
  };

  const handleGenerate = async () => {
    if (!session) {
      toast.error('Please sign in to generate question papers');
      router.push('/signin');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/qpg/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch {
        toast.error('Server error. Please try again.');
        return;
      }

      if (data.success) {
        setGeneratedPaper(data.questionPaper);
        setStep(4);
        toast.success('Question paper generated!');
      } else {
        toast.error(data.error || 'Generation failed');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleQuestionType = (id) => {
    setForm(prev => ({
      ...prev,
      questionTypes: prev.questionTypes.includes(id)
        ? prev.questionTypes.filter(t => t !== id)
        : [...prev.questionTypes, id]
    }));
  };

  // ── STEP 0: Branch & Semester ──────────────────────────────────────────────
  const renderStep0 = () => (
    <div>
      <h2 style={sectionTitle}>Select Branch</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '0.875rem',
        marginBottom: '2rem'
      }}>
        {BRANCHES.map(branch => (
          <button
            key={branch.id}
            onClick={() => setForm(p => ({ ...p, branch: branch.id, subject: null }))}
            style={{
              padding: '1.25rem 1rem',
              border: `2px solid ${form.branch === branch.id ? branch.color : '#e5e7eb'}`,
              borderRadius: '1rem',
              background: form.branch === branch.id ? branch.bg : 'white',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              boxShadow: form.branch === branch.id
                ? `0 4px 12px ${branch.color}25`
                : '0 1px 3px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => {
              if (form.branch !== branch.id) {
                e.currentTarget.style.borderColor = branch.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={e => {
              if (form.branch !== branch.id) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{branch.icon}</div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: form.branch === branch.id ? branch.color : '#374151',
              marginBottom: '0.25rem'
            }}>
              {branch.shortName}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#6b7280', lineHeight: '1.3' }}>
              {branch.name}
            </div>
          </button>
        ))}
      </div>

      <h2 style={sectionTitle}>Select Semester</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {SEMESTERS.map(sem => (
          <button
            key={sem}
            onClick={() => setForm(p => ({ ...p, semester: sem, subject: null }))}
            style={{
              width: '3.5rem',
              height: '3.5rem',
              border: `2px solid ${form.semester === sem ? '#6366f1' : '#e5e7eb'}`,
              borderRadius: '0.875rem',
              background: form.semester === sem ? '#f5f3ff' : 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '700',
              color: form.semester === sem ? '#6366f1' : '#374151',
              transition: 'all 0.2s ease',
              boxShadow: form.semester === sem ? '0 4px 12px rgba(99,102,241,0.2)' : 'none'
            }}
          >
            {sem}
          </button>
        ))}
      </div>
    </div>
  );

  // ── STEP 1: Subject ────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div>
      {selectedBranch && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: selectedBranch.bg,
          border: `1px solid ${selectedBranch.color}30`,
          borderRadius: '2rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: selectedBranch.color
        }}>
          <span>{selectedBranch.icon}</span>
          {selectedBranch.name} — Semester {form.semester}
        </div>
      )}

      <h2 style={sectionTitle}>Select Subject</h2>
      {availableSubjects.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {availableSubjects.map((subj, i) => (
            <button
              key={i}
              onClick={() => setForm(p => ({ ...p, subject: subj }))}
              style={{
                padding: '1rem 1.25rem',
                border: `2px solid ${form.subject === subj ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: '0.875rem',
                background: form.subject === subj ? '#f5f3ff' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.9375rem',
                fontWeight: form.subject === subj ? '600' : '500',
                color: form.subject === subj ? '#6366f1' : '#374151',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{subj}</span>
              {form.subject === subj && (
                <svg style={{ width: '1.25rem', height: '1.25rem', color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: '1rem',
          border: '2px dashed #e5e7eb',
          color: '#6b7280'
        }}>
          No subjects found for this semester. Subjects will be added by admin.
        </div>
      )}
    </div>
  );

  // ── STEP 2: Configuration ──────────────────────────────────────────────────
  const renderStep2 = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Question Types */}
      <div>
        <h2 style={sectionTitle}>Question Types</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {QUESTION_TYPES.map(qt => (
            <button
              key={qt.id}
              onClick={() => toggleQuestionType(qt.id)}
              style={{
                padding: '1rem',
                border: `2px solid ${form.questionTypes.includes(qt.id) ? '#6366f1' : '#e5e7eb'}`,
                borderRadius: '0.875rem',
                background: form.questionTypes.includes(qt.id) ? '#f5f3ff' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{qt.icon}</div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: form.questionTypes.includes(qt.id) ? '#6366f1' : '#111827',
                marginBottom: '0.25rem'
              }}>{qt.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{qt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <h2 style={sectionTitle}>Difficulty Level</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {DIFFICULTY_LEVELS.map(d => (
            <button
              key={d.id}
              onClick={() => setForm(p => ({ ...p, difficulty: d.id }))}
              style={{
                padding: '0.625rem 1.25rem',
                border: `2px solid ${form.difficulty === d.id ? d.color : '#e5e7eb'}`,
                borderRadius: '2rem',
                background: form.difficulty === d.id ? d.bg : 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: form.difficulty === d.id ? d.color : '#374151',
                transition: 'all 0.2s ease'
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { key: 'totalQuestions', label: 'Total Questions', min: 5, max: 30, unit: 'questions' },
          { key: 'totalMarks', label: 'Total Marks', min: 20, max: 100, unit: 'marks' },
          { key: 'examDuration', label: 'Duration', min: 60, max: 300, unit: 'minutes' },
        ].map(({ key, label, min, max, unit }) => (
          <div key={key}>
            <label style={{ ...labelStyle }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="number"
                min={min}
                max={max}
                value={form[key]}
                onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.875rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#111827',
                  outline: 'none',
                  background: 'white'
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
              <span style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Answer Key Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        background: '#f9fafb',
        borderRadius: '0.875rem',
        border: '2px solid #e5e7eb'
      }}>
        <div>
          <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#111827' }}>Include Answer Key</div>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Generate answer key along with questions</div>
        </div>
        <button
          onClick={() => setForm(p => ({ ...p, includeAnswerKey: !p.includeAnswerKey }))}
          style={{
            width: '3rem',
            height: '1.625rem',
            borderRadius: '2rem',
            border: 'none',
            background: form.includeAnswerKey
              ? 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)'
              : '#d1d5db',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s ease',
            flexShrink: 0
          }}
        >
          <div style={{
            position: 'absolute',
            top: '3px',
            left: form.includeAnswerKey ? 'calc(100% - 1.25rem)' : '3px',
            width: '1.125rem',
            height: '1.125rem',
            background: 'white',
            borderRadius: '50%',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }} />
        </button>
      </div>
    </div>
  );

  // ── STEP 3: Review & Generate ──────────────────────────────────────────────
  const renderStep3 = () => (
    <div>
      <h2 style={sectionTitle}>Review Configuration</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        {[
          { label: 'Branch', value: selectedBranch?.name, icon: selectedBranch?.icon },
          { label: 'Semester', value: `Semester ${form.semester}`, icon: '📅' },
          { label: 'Subject', value: form.subject, icon: '📖' },
          { label: 'Question Types', value: form.questionTypes.join(', '), icon: '❓' },
          { label: 'Difficulty', value: form.difficulty, icon: '🎯' },
          { label: 'Total Questions', value: form.totalQuestions, icon: '🔢' },
          { label: 'Total Marks', value: form.totalMarks, icon: '⭐' },
          { label: 'Duration', value: `${form.examDuration} minutes`, icon: '⏱️' },
          { label: 'Answer Key', value: form.includeAnswerKey ? 'Yes' : 'No', icon: '🔑' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.875rem 1.25rem',
            background: 'white',
            border: '1px solid #f3f4f6',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: '500', width: '8rem', flexShrink: 0 }}>
              {item.label}
            </span>
            <span style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        style={{
          width: '100%',
          padding: '1rem',
          background: generating ? '#e5e7eb' : 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
          color: generating ? '#9ca3af' : 'white',
          border: 'none',
          borderRadius: '0.875rem',
          fontSize: '1rem',
          fontWeight: '700',
          cursor: generating ? 'not-allowed' : 'pointer',
          boxShadow: generating ? 'none' : '0 4px 15px rgba(99,102,241,0.35)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}
        onMouseEnter={e => {
          if (!generating) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.4)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          if (!generating) e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.35)';
        }}
      >
        {generating ? (
          <>
            <svg style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating Paper...
          </>
        ) : (
          <>
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Question Paper
          </>
        )}
      </button>
    </div>
  );

  // ── STEP 4: Result ─────────────────────────────────────────────────────────
  const renderResult = () => (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '5rem',
        height: '5rem',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem'
      }}>
        <svg style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' }}>
        Paper Generated!
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '0.9375rem' }}>
        Your question paper is ready for download.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.open(`/api/qpg/download/${generatedPaper?._id}`, '_blank')}
          style={{
            padding: '0.875rem 2rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '0.875rem',
            fontSize: '0.9375rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}
        >
          <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
        <button
          onClick={() => { setStep(0); setGeneratedPaper(null); setForm({ branch: null, semester: null, subject: null, questionTypes: [], difficulty: 'mixed', totalQuestions: 10, totalMarks: 70, examDuration: 180, instructions: '', includeAnswerKey: false }); }}
          style={{
            padding: '0.875rem 2rem',
            background: 'white',
            color: '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '0.875rem',
            fontSize: '0.9375rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Generate Another
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8faff 0%, #f5f3ff 50%, #faf5ff 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '42rem', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '4rem',
            height: '4rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
            borderRadius: '1.25rem',
            marginBottom: '1rem',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
          }}>
            <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>
            Question Paper Generator
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
            Generate GTU-style question papers in seconds using AI
          </p>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <StepIndicator steps={steps} current={step} />
        )}

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderResult()}
        </div>

        {/* Navigation Buttons */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '0.875rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                color: step === 0 ? '#d1d5db' : '#374151',
                cursor: step === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            {step < 3 && (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                style={{
                  padding: '0.75rem 1.75rem',
                  background: canNext()
                    ? 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)'
                    : '#e5e7eb',
                  border: 'none',
                  borderRadius: '0.875rem',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  color: canNext() ? 'white' : '#9ca3af',
                  cursor: canNext() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: canNext() ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                }}
              >
                Next
                <svg style={{ width: '1.125rem', height: '1.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── SHARED STYLES ─────────────────────────────────────────────────────────────
const sectionTitle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: '#111827',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const labelStyle = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '0.5rem'
};