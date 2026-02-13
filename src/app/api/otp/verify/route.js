import { NextResponse } from "next/server";
import connectDB from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

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

    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const otpString = String(otp).trim();

    if (!/^\d{6}$/.test(otpString)) {
      return NextResponse.json(
        { success: false, error: "OTP must be exactly 6 digits" },
        { status: 400 },
      );
    }

    // CRITICAL: must select +otp.code +otp.expiresAt as they have select: false
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+otp.code +otp.expiresAt +password",
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with this email" },
        { status: 404 },
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: true, message: "Email already verified. Please sign in." },
        { status: 200 },
      );
    }

    if (!user.otp?.code || !user.otp?.expiresAt) {
      return NextResponse.json(
        { success: false, error: "OTP not found. Please request a new one." },
        { status: 400 },
      );
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    const storedOTP = String(user.otp.code).trim();

    console.log("[OTP Debug]", {
      entered: otpString,
      stored: storedOTP,
      match: otpString === storedOTP,
    });

    if (otpString !== storedOTP) {
      return NextResponse.json(
        { success: false, error: "Incorrect OTP. Please try again." },
        { status: 400 },
      );
    }

    // Mark verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    return NextResponse.json(
      { success: true, message: "Email verified successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("[otp/verify] Error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}
