// src/app/api/subscription/cancel/route.js
import { NextResponse }     from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions }      from '@/lib/auth/authOptions';
import connectDB            from '@/lib/db/mongodb';
import User                 from '@/lib/db/models/User';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('subscription');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const sub = user.subscription;
    if (!sub || sub.plan === 'free' || sub.status !== 'active') {
      return NextResponse.json({ success: false, error: 'No active subscription to cancel' }, { status: 400 });
    }

    // Mark as cancelled — access continues until endDate (no refund)
    await User.findByIdAndUpdate(session.user.id, {
      'subscription.status': 'cancelled',
    });

    console.log(`[subscription/cancel] ${session.user.email} cancelled ${sub.plan} — active until ${sub.endDate}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled. You retain access until the end of your billing period.',
      endDate: sub.endDate,
    });

  } catch (error) {
    console.error('[subscription/cancel] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel: ' + error.message }, { status: 500 });
  }
}