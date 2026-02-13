import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { sendOTPEmail } from '@/lib/utils/emailService';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = newOTP;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(user.email, newOTP, user.name);

    console.log('[resend-otp] OTP resent to:', user.email);

    return NextResponse.json(
      { success: true, message: 'OTP sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[resend-otp] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend OTP. Please try again.' },
      { status: 500 }
    );
  }
}