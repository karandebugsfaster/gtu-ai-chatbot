import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb"; // ← CORRECT PATH
import User from "@/lib/db/models/User"; // ← CORRECT PATH
import { sendOTPEmail } from "@/lib/utils/emailService";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { name, email, password } = body;

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.isVerified) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email already exists",
          },
          { status: 409 },
        );
      }

      // User exists but unverified — resend OTP
      const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
      existingUser.otp = {
        code: newOTP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
      await existingUser.save();
      await sendOTPEmail(normalizedEmail, newOTP, existingUser.name);

      return NextResponse.json(
        { success: true, message: "OTP resent", email: normalizedEmail },
        { status: 200 },
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password, // Will be hashed by pre-save hook
      otp: {
        code: otp,
        expiresAt: otpExpiry,
      },
      isVerified: false,
    });

    await sendOTPEmail(normalizedEmail, otp, name.trim());

    return NextResponse.json(
      {
        success: true,
        message: "Account created. Please verify your email.",
        email: normalizedEmail,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[signup] Error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
