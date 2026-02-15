// // src/app/api/payment/verify/route.js
// import { NextResponse }     from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions }      from '@/lib/auth/authOptions';
// import crypto               from 'crypto';
// import connectDB            from '@/lib/db/mongodb';
// import User                 from '@/lib/db/models/User';
// import { PLANS }            from '@/lib/config/plans';

// export async function POST(request) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
//     }

//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       planId,
//     } = await request.json();

//     // ── Verify signature ──────────────────────────────────────────────────────
//     const body      = razorpay_order_id + '|' + razorpay_payment_id;
//     const expected  = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest('hex');

//     if (expected !== razorpay_signature) {
//       return NextResponse.json(
//         { success: false, error: 'Payment verification failed — invalid signature' },
//         { status: 400 }
//       );
//     }

//     // ── Find plan ─────────────────────────────────────────────────────────────
//     const plan = PLANS.find(p => p.id === planId);
//     if (!plan) {
//       return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 400 });
//     }

//     // ── Update user subscription in MongoDB ───────────────────────────────────
//     await connectDB();

//     const startDate = new Date();
//     const endDate   = new Date();
//     endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

//     await User.findByIdAndUpdate(session.user.id, {
//       subscription: {
//         plan:      plan.id,
//         status:    'active',
//         startDate,
//         endDate,
//         paymentId: razorpay_payment_id,
//         orderId:   razorpay_order_id,
//       },
//       // Reset message count on new subscription
//       messagesUsed: 0,
//     });

//     console.log(`[payment/verify] ✅ User ${session.user.email} upgraded to ${plan.name}`);

//     return NextResponse.json({
//       success: true,
//       message: `Successfully upgraded to ${plan.name}!`,
//       plan: plan.id,
//     });

//   } catch (error) {
//     console.error('[payment/verify] Error:', error.message);
//     return NextResponse.json(
//       { success: false, error: 'Verification failed: ' + error.message },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/payment/verify/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { getPlanById } from '@/lib/config/plans';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = await request.json();

    // 🔐 Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // ✅ Get correct plan from your object config
    const plan = getPlanById(planId);

    if (!plan || plan.price === 0) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 400 }
      );
    }

    // 💾 Update user subscription
    await connectDB();

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    await User.findByIdAndUpdate(session.user.id, {
      subscription: {
        plan: plan.id,
        status: 'active',
        startDate,
        endDate,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
      messagesUsed: 0,
    });

    console.log(
      `[payment/verify] ✅ ${session.user.email} upgraded to ${plan.name}`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}!`,
      plan: plan.id,
    });

  } catch (error) {
    console.error('[payment/verify] Error:', error);

    return NextResponse.json(
      { success: false, error: 'Verification failed: ' + error.message },
      { status: 500 }
    );
  }
}
