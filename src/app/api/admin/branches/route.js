import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import Branch from '@/lib/db/models/Branch';

// GET all branches
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const filter = activeOnly ? { isActive: true } : {};

    const branches = await Branch.find(filter)
      .sort({ branchCode: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      branches
    });

  } catch (error) {
    console.error('Get branches error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

// POST create new branch
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { branchCode, branchName, fullName, description } = await request.json();

    if (!branchCode || !branchName || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if branch already exists
    const existing = await Branch.findOne({ branchCode: branchCode.toUpperCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Branch code already exists' },
        { status: 409 }
      );
    }

    const branch = await Branch.create({
      branchCode: branchCode.toUpperCase(),
      branchName,
      fullName,
      description
    });

    return NextResponse.json({
      success: true,
      branch
    }, { status: 201 });

  } catch (error) {
    console.error('Create branch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}