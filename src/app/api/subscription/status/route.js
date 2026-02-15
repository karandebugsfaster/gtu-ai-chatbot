// // src/app/api/subscription/status/route.js
// import { NextResponse }     from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions }      from '@/lib/auth/authOptions';
// import connectDB            from '@/lib/db/mongodb';
// import User                 from '@/lib/db/models/User';
// import { PLANS, getPlanById } from '@/lib/config/plans';

// export async function GET(request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
//     }

//     await connectDB();

//     const user = await User.findById(session.user.id)
//       .select('subscription messagesUsed')
//       .lean();

//     if (!user) {
//       return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
//     }

//     // Determine active plan
//     const now          = new Date();
//     const sub          = user.subscription;
//     const isActive     = sub?.status === 'active' && sub?.endDate && new Date(sub.endDate) > now;
//     const planId       = isActive ? (sub.plan || 'free') : 'free';
//     const planDetails  = getPlanById(planId) || getPlanById('free');

//     const messagesUsed      = user.messagesUsed || 0;
//     const messagesLimit     = planDetails.limits.messagesPerMonth;
//     const messagesRemaining = Math.max(0, messagesLimit - messagesUsed);

//     return NextResponse.json({
//       success: true,
//       plan:    planId,
//       planDetails: {
//         name:  planDetails.name,
//         price: planDetails.price,
//         limits: planDetails.limits,
//       },
//       subscription: isActive ? {
//         status:    sub.status,
//         startDate: sub.startDate,
//         endDate:   sub.endDate,
//       } : null,
//       usage: {
//         messagesUsed,
//         messagesLimit,
//         messagesRemaining,
//         isLimitReached: messagesUsed >= messagesLimit,
//       },
//     });

//   } catch (error) {
//     console.error('[subscription/status] Error:', error.message);
//     return NextResponse.json(
//       { success: false, error: 'Failed to get subscription status' },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/subscription/status/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getPlanById } from '@/lib/config/plans';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select('subscription messagesUsed')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const sub = user.subscription;

    const isActive =
      sub?.status === 'active' &&
      sub?.endDate &&
      new Date(sub.endDate) > now;

    const planId = isActive ? sub.plan : 'free';
    const planDetails = getPlanById(planId);

    const messagesUsed = user.messagesUsed || 0;
    const messagesLimit = planDetails.limits.messagesPerMonth;
    const messagesRemaining = Math.max(0, messagesLimit - messagesUsed);

    return NextResponse.json({
      success: true,
      plan: planId,
      planDetails: {
        name: planDetails.name,
        price: planDetails.price,
        limits: planDetails.limits,
      },
      subscription: isActive
        ? {
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
          }
        : null,
      usage: {
        messagesUsed,
        messagesLimit,
        messagesRemaining,
        isLimitReached: messagesUsed >= messagesLimit,
      },
    });

  } catch (error) {
    console.error('[subscription/status] Error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
