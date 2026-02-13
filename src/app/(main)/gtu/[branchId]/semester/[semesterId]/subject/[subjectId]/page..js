'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/ui/Loader';
import toast from 'react-hot-toast';

export default async function SubjectResourcesPage({ params }) {
  const router = useRouter();
  const { branchId, semesterId, subjectId } = await params;
  const [resources, setResources] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('books');
  const [selectedPYQ, setSelectedPYQ] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [subjectId]);

  const fetchResources = async () => {
    try {
      const [resourcesRes, subjectsRes] = await Promise.all([
        fetch(`/api/gtu/resources?subjectId=${subjectId}`),
        fetch(`/api/gtu/subjects?branchId=${branchId}&semester=${semesterId}`)
      ]);

      const resourcesData = await resourcesRes.json();
      const subjectsData = await subjectsRes.json();

      if (resourcesData.success) {
        setResources(resourcesData.resources);
      }

      if (subjectsData.success) {
        const currentSubject = subjectsData.subjects.find(s => s._id === subjectId);
        setSubject(currentSubject);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    router.push(`/chat?context=subject&subjectId=${subjectId}`);
  };

  const tabs = [
    { id: 'books', label: 'Books', icon: '📚', count: resources?.counts.books || 0 },
    { id: 'notes', label: 'Notes', icon: '📝', count: resources?.counts.notes || 0 },
    { id: 'pyqs', label: 'PYQs', icon: '📄', count: resources?.counts.pyqs || 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="lg" text="Loading resources..." />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6 flex-wrap">
          <button onClick={() => router.push('/gtu')} className="hover:text-primary-600 transition-colors">
            GTU Resources
          </button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <button onClick={() => router.push(`/gtu/${branchId}`)} className="hover:text-primary-600 transition-colors">
            Branch
          </button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <button onClick={() => router.push(`/gtu/${branchId}/semester/${semesterId}`)} className="hover:text-primary-600 transition-colors">
            Semester {semesterId}
          </button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{subject?.subjectName}</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{subject?.subjectName}</h1>
              <p className="text-gray-600">{subject?.subjectCode}</p>
            </div>
            <Button
              onClick={handleStartChat}
              className="flex items-center gap-2"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            >
              Chat about this subject
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="border-b border-gray-200">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'books' && (
              <ResourceGrid resources={resources?.resources.books} type="book" />
            )}
            {activeTab === 'notes' && (
              <ResourceGrid resources={resources?.resources.notes} type="note" />
            )}
            {activeTab === 'pyqs' && (
              <PYQGrid resources={resources?.resources.pyqs} onSelect={setSelectedPYQ} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* PYQ Modal */}
        <Modal
          isOpen={!!selectedPYQ}
          onClose={() => setSelectedPYQ(null)}
          title="PYQ Details"
          size="lg"
        >
          {selectedPYQ && (
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedPYQ.examName}</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Academic Year</p>
                  <p className="font-medium">{selectedPYQ.academicYear}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Exam Type</p>
                  <p className="font-medium capitalize">{selectedPYQ.examType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="font-medium">{selectedPYQ.totalMarks}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{selectedPYQ.duration}</p>
                </div>
              </div>
              <Button
                fullWidth
                onClick={() => window.open(`/api/download/pyq/${selectedPYQ._id}`, '_blank')}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                Download PDF
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

function ResourceGrid({ resources, type }) {
  if (!resources || resources.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No {type}s available</h3>
        <p className="text-gray-500">Resources will be added soon</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource, index) => (
        <motion.div
          key={resource._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index }}
        >
          <Card className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {resource.title}
                  </h3>
                  {resource.metadata?.author && (
                    <p className="text-sm text-gray-500">by {resource.metadata.author}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {resource.views || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {resource.downloads || 0} downloads
                </span>
              </div>

              <Button
                fullWidth
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/download/document/${resource._id}`, '_blank')}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                Download
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function PYQGrid({ resources, onSelect }) {
  if (!resources || resources.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No PYQs available</h3>
        <p className="text-gray-500">Previous year question papers will be added soon</p>
      </div>
    );
  }

  // Group by year
  const groupedByYear = resources.reduce((acc, pyq) => {
    const year = pyq.academicYear;
    if (!acc[year]) acc[year] = [];
    acc[year].push(pyq);
    return acc;
  }, {});

  const years = Object.keys(groupedByYear).sort().reverse();

  return (
    <div className="space-y-6">
      {years.map((year) => (
        <div key={year}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{year}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedByYear[year].map((pyq, index) => (
              <motion.div
                key={pyq._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card hover onClick={() => onSelect(pyq)} className="cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {pyq.examName}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="capitalize">{pyq.examType}</span>
                        <span>•</span>
                        <span>{pyq.totalMarks} marks</span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}