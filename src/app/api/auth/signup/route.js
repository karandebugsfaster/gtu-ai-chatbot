import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';
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

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists' },
          { status: 409 }
        );
      } else {
        // Resend OTP to unverified user
        const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        existingUser.otp = newOTP;
        existingUser.otpExpiry = otpExpiry;
        await existingUser.save();

        await sendOTPEmail(normalizedEmail, newOTP, existingUser.name);

        return NextResponse.json(
          {
            success: true,
            message: 'OTP resent to your email',
            email: normalizedEmail
          },
          { status: 200 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false
    });

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, name.trim());

    console.log('[signup] User created:', normalizedEmail);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created. Please verify your email.',
        email: normalizedEmail
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[signup] Error:', error);

    // Handle mongoose duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}