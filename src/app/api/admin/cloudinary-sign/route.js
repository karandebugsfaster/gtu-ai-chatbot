// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth/authOptions";
// import { v2 as cloudinary } from "cloudinary";

// export const runtime = "nodejs";

// // ✅ Parse all credentials from CLOUDINARY_URL
// const cloudUrl  = new URL(process.env.CLOUDINARY_URL.replace("cloudinary://", "https://"));
// const cloudName = cloudUrl.hostname;
// const apiKey    = cloudUrl.username;
// const apiSecret = cloudUrl.password;

// cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

// export async function POST(request) {
//   const session = await getServerSession(authOptions);
//   if (!session || session.user?.role !== "admin") {
//     return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//   }

//   const { publicId } = await request.json();
//   const timestamp    = Math.round(Date.now() / 1000);

// // ✅ NEW — remove resource_type from signature params
// const signature = cloudinary.utils.api_sign_request(
//   { timestamp, public_id: publicId },
//   apiSecret
// );

//   return NextResponse.json({
//     success:   true,
//     signature,
//     timestamp,
//     cloudName, // ✅ parsed from URL
//     apiKey,    // ✅ parsed from URL
//   });
// }

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const cloudUrl  = new URL(process.env.CLOUDINARY_URL.replace("cloudinary://", "https://"));
const cloudName = cloudUrl.hostname;
const apiKey    = cloudUrl.username;
const apiSecret = cloudUrl.password;

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { publicId } = await request.json();
  const timestamp    = Math.round(Date.now() / 1000);

  // ✅ Sign only timestamp + public_id (no folder, no resource_type)
const signature = cloudinary.utils.api_sign_request(
  { timestamp, public_id: publicId, access_mode: 'public' }, // ✅ add access_mode
  apiSecret
);

  return NextResponse.json({
    success: true,
    signature,
    timestamp,
    cloudName,
    apiKey,
  });
}