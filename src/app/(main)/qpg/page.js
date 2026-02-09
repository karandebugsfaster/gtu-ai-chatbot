'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';
import toast from 'react-hot-toast';

export default function QPGPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const [formData, setFormData] = useState({
    branchId: '',
    semester: '',
    subjectId: '',
    yearRangeStart: '2020',
    yearRangeEnd: '2024',
    totalMarks: 70,
    duration: '3 hours',
    generationType: 'pattern-based'
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (formData.branchId && formData.semester) {
      fetchSubjects();
    }
  }, [formData.branchId, formData.semester]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/gtu/branches');
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(
        `/api/gtu/subjects?branchId=${formData.branchId}&semester=${formData.semester}`
      );
      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!formData.subjectId) {
      toast.error('Please select a subject');
      return;
    }

    setAnalyzing(true);

    try {
      const response = await fetch('/api/qpg/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: formData.subjectId,
          yearRange: {
            start: formData.yearRangeStart,
            end: formData.yearRangeEnd
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        setStep(2);
        toast.success('Analysis completed successfully!');
      } else {
        toast.error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing PYQs:', error);
      toast.error('Failed to analyze PYQs');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);

    try {
      const response = await fetch('/api/qpg/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: formData.subjectId,
          config: {
            totalMarks: formData.totalMarks,
            duration: formData.duration,
            generationType: formData.generationType,
            yearRange: {
              start: formData.yearRangeStart,
              end: formData.yearRangeEnd
            }
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Question paper generated successfully!');
        setStep(3);
        // Download the generated paper
        window.open(`/api/qpg/download/${data.questionPaper._id}`, '_blank');
      } else {
        toast.error(data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Error generating QP:', error);
      toast.error('Failed to generate question paper');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-2">
            AI Question Paper Generator
          </h1>
          <p className="text-gray-600">
            Generate custom question papers based on previous year patterns and analysis
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Configure' },
              { num: 2, label: 'Analyze' },
              { num: 3, label: 'Generate' }
            ].map((s, index) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s.num
                        ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step > s.num ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${step >= s.num ? 'text-primary-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {index < 2 && (
                  <div className={`h-1 flex-1 mx-2 transition-all ${step > s.num ? 'bg-primary-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {step === 1 && (
            <Card className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure Question Paper</h2>

              <div className="space-y-5">
                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value, subjectId: '' })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                  >
                    <option value="">Choose a branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.branchName} ({branch.branchCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value, subjectId: '' })}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                  >
                    <option value="">Choose a semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    disabled={!formData.branchId || !formData.semester}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.subjectName} ({subject.subjectCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Range */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="From Year"
                    type="text"
                    value={formData.yearRangeStart}
                    onChange={(e) => setFormData({ ...formData, yearRangeStart: e.target.value })}
                    placeholder="2020"
                  />
                  <Input
                    label="To Year"
                    type="text"
                    value={formData.yearRangeEnd}
                    onChange={(e) => setFormData({ ...formData, yearRangeEnd: e.target.value })}
                    placeholder="2024"
                  />
                </div>

                {/* Total Marks & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Total Marks"
                    type="number"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                  />
                  <Input
                    label="Duration"
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>

                <Button
                  fullWidth
                  size="lg"
                  onClick={handleAnalyze}
                  loading={analyzing}
                  disabled={!formData.subjectId}
                  className="mt-6"
                >
                  {analyzing ? 'Analyzing PYQs...' : 'Analyze & Continue'}
                </Button>
              </div>
            </Card>
          )}

          {step === 2 && analysis && (
            <div className="space-y-6">
              {/* Analysis Results */}
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">Total PYQs</p>
                    <p className="text-3xl font-bold text-blue-900">{analysis.totalPYQs}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-600 font-medium mb-1">Questions</p>
                    <p className="text-3xl font-bold text-purple-900">{analysis.totalQuestions}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-sm text-green-600 font-medium mb-1">Repeated</p>
                    <p className="text-3xl font-bold text-green-900">{analysis.repeatedQuestions?.length || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-sm text-orange-600 font-medium mb-1">Year Range</p>
                    <p className="text-xl font-bold text-orange-900">
                      {analysis.yearRange?.start} - {analysis.yearRange?.end}
                    </p>
                  </div>
                </div>

                {/* Topic Frequency */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Topics</h3>
                  <div className="space-y-2">
                    {analysis.topicFrequency?.slice(0, 5).map((topic, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                            <span className="text-sm text-gray-500">{topic.count} questions</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-600 to-purple-600 rounded-full transition-all"
                              style={{ width: `${topic.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Difficulty Distribution</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="text-sm text-green-600 font-medium mb-1">Easy</p>
                      <p className="text-2xl font-bold text-green-900">
                        {analysis.difficultyDistribution?.easy?.percentage || 0}%
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <p className="text-sm text-yellow-600 font-medium mb-1">Medium</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {analysis.difficultyDistribution?.medium?.percentage || 0}%
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-red-600 font-medium mb-1">Hard</p>
                      <p className="text-2xl font-bold text-red-900">
                        {analysis.difficultyDistribution?.hard?.percentage || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* High Probability Questions */}
              {analysis.highProbabilityQuestions?.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    High Probability Questions (Top 5)
                  </h3>
                  <div className="space-y-3">
                    {analysis.highProbabilityQuestions.slice(0, 5).map((item, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg border border-primary-200">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-medium text-gray-900 flex-1">{item.topic}</h4>
                          <span className="px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
                            {item.probability}% probability
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Appeared {item.frequency} times</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back to Configure
                </Button>
                <Button
                  size="lg"
                  onClick={handleGenerate}
                  loading={generating}
                  className="flex-1"
                >
                  {generating ? 'Generating...' : 'Generate Question Paper'}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <Card className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Question Paper Generated Successfully!
              </h2>
              <p className="text-gray-600 mb-8">
                Your question paper has been generated and downloaded automatically.
              </p>

              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setAnalysis(null);
                  }}
                >
                  Generate Another
                </Button>
                <Button onClick={() => router.push('/gtu')}>
                  Browse Resources
                </Button>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}