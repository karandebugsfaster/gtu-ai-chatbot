import { NextResponse } from 'next/server';
import connectDB from '@/lib/config/db';
import User from '@/models/User';

export async function POST(request) {
  try {
    // Always parse body safely
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const otpString = String(otp).trim();

    if (!/^\d{6}$/.test(otpString)) {
      return NextResponse.json(
        { success: false, error: 'OTP must be exactly 6 digits' },
        { status: 400 }
      );
    }

    // Find user - explicitly select otp and otpExpiry
    const user = await User.findOne({ email: normalizedEmail })
      .select('+otp +otpExpiry');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: true, message: 'Email already verified. Please sign in.' },
        { status: 200 }
      );
    }

    if (!user.otp || !user.otpExpiry) {
      return NextResponse.json(
        { success: false, error: 'OTP not found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Compare OTPs
    const storedOTP = String(user.otp).trim();

    console.log('[OTP Debug]', {
      entered: otpString,
      stored: storedOTP,
      match: otpString === storedOTP
    });

    if (otpString !== storedOTP) {
      return NextResponse.json(
        { success: false, error: 'Incorrect OTP. Please try again.' },
        { status: 400 }
      );
    }

    // Mark verified - clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return NextResponse.json(
      { success: true, message: 'Email verified successfully!' },
      { status: 200 }
    );

  } catch (error) {
    console.error('[verify-otp] Error:', error);
    // Always return JSON, never plain text
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}