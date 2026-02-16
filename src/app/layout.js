// import { Geist, Geist_Mono } from "next/font/google";
// import { getServerSession } from "next-auth";           // ✅ ADD
// import { authOptions } from "@/lib/auth/authOptions";   // ✅ ADD
// import Providers from "./providers";
// import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata = {
//   title: "GTU-AI-chatbot",
//   description: "This is a AI chatbot specially made for GTU students to help them in their studies",
// };

// export default async function RootLayout({ children }) {   // ✅ async
//   const session = await getServerSession(authOptions);     // ✅ fetch session

//   return (
//     <html lang="en">
//       <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
//         <Providers session={session}>
//           {children}
//         </Providers>
//       </body>
//     </html>
//   );
// }
// src/app/layout.js
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "GTU-AI-chatbot",
  description: "AI chatbot for GTU students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>  {/* ← NO session prop */}
          {children}
        </Providers>
      </body>
    </html>
  );
}