'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/ui/Loader';
import toast from 'react-hot-toast';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    type: 'book',
    subjectId: '',
    branchId: '',
    semester: '',
    academicYear: '2024-2025',
    author: '',
    publisher: '',
    edition: ''
  });

  useEffect(() => {
    fetchDocuments();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (uploadForm.branchId && uploadForm.semester) {
      fetchSubjects();
    }
  }, [uploadForm.branchId, uploadForm.semester]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

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
        `/api/gtu/subjects?branchId=${uploadForm.branchId}&semester=${uploadForm.semester}`
      );
      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error('File size must be less than 100MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!uploadForm.title || !uploadForm.subjectId || !uploadForm.branchId || !uploadForm.semester) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('type', uploadForm.type);
      formData.append('subjectId', uploadForm.subjectId);
      formData.append('branchId', uploadForm.branchId);
      formData.append('semester', uploadForm.semester);
      formData.append('academicYear', uploadForm.academicYear);
      if (uploadForm.author) formData.append('author', uploadForm.author);
      if (uploadForm.publisher) formData.append('publisher', uploadForm.publisher);
      if (uploadForm.edition) formData.append('edition', uploadForm.edition);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Document uploaded successfully!');
        
        // Process the document
        processDocument(data.documentId);
        
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadForm({
          title: '',
          type: 'book',
          subjectId: '',
          branchId: '',
          semester: '',
          academicYear: '2024-2025',
          author: '',
          publisher: '',
          edition: ''
        });
        fetchDocuments();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (documentId) => {
    setProcessing(true);
    toast.loading('Processing document...', { id: 'processing' });

    try {
      const response = await fetch('/api/admin/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Document processed! ${data.chunksCreated} chunks created`, { id: 'processing' });
        fetchDocuments();
      } else {
        toast.error('Processing failed', { id: 'processing' });
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Processing failed', { id: 'processing' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      } else {
        toast.error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="lg" text="Loading documents..." />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">Manage uploaded books, notes, and references</p>
          </div>
          <Button onClick={() => setShowUploadModal(true)}>
            Upload Document
          </Button>
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <Card className="text-center py-12">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">Upload your first document to get started</p>
            <Button onClick={() => setShowUploadModal(true)}>Upload Document</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc._id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      doc.processingStatus === 'completed' ? 'bg-green-100' :
                      doc.processingStatus === 'processing' ? 'bg-yellow-100' :
                      doc.processingStatus === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {doc.type === 'book' && '📚'}
                      {doc.type === 'notes' && '📝'}
                      {doc.type === 'reference' && '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">
                          {doc.subject?.subjectName} • Sem {doc.semester}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          doc.processingStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          doc.processingStatus === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                          doc.processingStatus === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.processingStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.processingStatus === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => processDocument(doc._id)}
                        disabled={processing}
                      >
                        Process
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(doc._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Document"
          size="lg"
        >
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                placeholder="e.g., Data Structures Textbook"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={uploadForm.type}
                onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              >
                <option value="book">Book</option>
                <option value="notes">Notes</option>
                <option value="reference">Reference Material</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadForm.branchId}
                  onChange={(e) => setUploadForm({ ...uploadForm, branchId: e.target.value, subjectId: '' })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadForm.semester}
                  onChange={(e) => setUploadForm({ ...uploadForm, semester: e.target.value, subjectId: '' })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={uploadForm.subjectId}
                onChange={(e) => setUploadForm({ ...uploadForm, subjectId: e.target.value })}
                disabled={!uploadForm.branchId || !uploadForm.semester}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none disabled:bg-gray-100"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                <input
                  type="text"
                  value={uploadForm.author}
                  onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                <input
                  type="text"
                  value={uploadForm.publisher}
                  onChange={(e) => setUploadForm({ ...uploadForm, publisher: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Edition</label>
                <input
                  type="text"
                  value={uploadForm.edition}
                  onChange={(e) => setUploadForm({ ...uploadForm, edition: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload PDF <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">Click to upload PDF</p>
                      <p className="text-xs text-gray-500 mt-1">Max file size: 50MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={handleUpload}
                loading={uploading}
              >
                Upload & Process
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}