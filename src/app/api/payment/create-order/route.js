import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getPlanById } from '@/lib/config/plans';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // 🔐 Check session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planId } = await request.json();

    // ✅ Get plan properly from your object config
    const plan = getPlanById(planId);

    if (!plan || plan.price === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // 🔥 Dynamic import (fixes Turbopack + CommonJS issue)
    const Razorpay = (await import('razorpay')).default;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: plan.price * 100, // convert ₹ to paise
      currency: 'INR',
      receipt: `ord_${Date.now()}`,
      notes: {
        userId: session.user.id,
        planId: plan.id,
        email: session.user.email,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
      },
    });

  } catch (error) {
    console.error('[payment/create-order] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order: ' + error.message,
      },
      { status: 500 }
    );
  }
}
