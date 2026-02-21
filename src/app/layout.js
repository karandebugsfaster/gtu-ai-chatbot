
import { Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "GTU-AI-chatbot",
  description: "AI chatbot for GTU students",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
// import { Geist, Geist_Mono } from "next/font/google";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth/authOptions";
// import { redirect } from "next/navigation";
// import Providers from "./providers";
// import "./globals.css";

// const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata = {
//   title: "GTU-AI-chatbot",
//   description: "AI chatbot for GTU students",
// };

// export default async function RootLayout({ children }) {
//   const isDisabled =
//     process.env.NEXT_PUBLIC_SITE_DISABLED === "true";

//   const session = await getServerSession(authOptions);

//   return (
//     <html lang="en">
//       <body
//         className={`${geistSans.variable} ${geistMono.variable} antialiased`}
//       >
//         {isDisabled ? (
//           <div className="flex items-center justify-center min-h-screen bg-black text-white">
//             <div className="text-center">
//               <h1 className="text-4xl font-bold mb-4">This website is Launcing Soon</h1>
//               <p className="opacity-80">
//                 We are working hard to bring you an amazing experience. Stay tuned for updates!
//               </p>
//             </div>
//           </div>
//         ) : (
//           <Providers session={session}>
//             {children}
//           </Providers>
//         )}
//       </body>
//     </html>
//   );
// }

//something was broken, Let's hope it gets fixed by this commit.