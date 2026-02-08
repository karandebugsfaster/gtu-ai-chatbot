import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import { signupSchema } from '@/lib/utils/validation';
import { sendOTPEmail } from '@/lib/utils/emailService';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate input
    const validatedData = signupSchema.parse(body);
    const { name, email, password } = validatedData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: 'user',
      isVerified: false
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Delete user if email fails
      await User.deleteOne({ _id: user._id });
      return NextResponse.json(
        { success: false, error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for OTP.',
      userId: user._id,
      email: user.email
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}