'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Loader from '@/components/ui/Loader';

export default async function BranchPage({ params }) {
  const router = useRouter();
  const { branchId } = await params;
  const [branch, setBranch] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranchDetails();
  }, [branchId]);

  const fetchBranchDetails = async () => {
    try {
      const response = await fetch(`/api/gtu/branches`);
      const data = await response.json();
      if (data.success) {
        const branchData = data.branches.find(b => b._id === branchId);
        setBranch(branchData);
      }
    } catch (error) {
      console.error('Error fetching branch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="lg" text="Loading..." />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Branch not found</p>
      </div>
    );
  }

  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <button onClick={() => router.push('/gtu')} className="hover:text-primary-600 transition-colors">
            GTU Resources
          </button>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">{branch.branchName}</span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">
                {branch.branchCode.substring(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{branch.branchName}</h1>
              <p className="text-gray-600">{branch.fullName}</p>
            </div>
          </div>
        </motion.div>

        {/* Semester Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Semester</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {semesters.map((sem) => (
              <Card
                key={sem}
                hover
                onClick={() => router.push(`/gtu/${branchId}/semester/${sem}`)}
                className="cursor-pointer group"
              >
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-primary-600">{sem}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    Semester {sem}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}