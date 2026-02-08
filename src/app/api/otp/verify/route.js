import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { otpSchema } from '@/lib/utils/validation';
import { sendWelcomeEmail } from '@/lib/utils/emailService';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = otpSchema.parse(body);
    const { email, otp } = validatedData;

    // Find user
    const user = await User.findOne({ email }).select('+otp');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = user.verifyOTP(otp);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(email, user.name).catch(err => 
      console.error('Welcome email failed:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('OTP verify error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}