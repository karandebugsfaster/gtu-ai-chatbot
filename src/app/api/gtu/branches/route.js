import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Branch from '@/lib/db/models/Branch';

export async function GET(request) {
  try {
    await connectDB();

    const branches = await Branch.find({ isActive: true })
      .select('branchCode branchName fullName')
      .sort({ branchCode: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      branches
    });

  } catch (error) {
    console.error('Get GTU branches error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}