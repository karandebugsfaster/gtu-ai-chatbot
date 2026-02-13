import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db/mongodb"; // ← CORRECT PATH
import User from "@/lib/db/models/User"; // ← CORRECT PATH
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[Auth] Missing credentials");
          throw new Error("Email and password are required");
        }

        try {
          await connectDB();

          const normalizedEmail = credentials.email.toLowerCase().trim();
          console.log("[Auth] Attempting signin for:", normalizedEmail);

          const user = await User.findOne({
            email: normalizedEmail,
          }).select("+password");

          if (!user) {
            console.error("[Auth] User not found:", normalizedEmail);
            throw new Error("Invalid email or password");
          }

          console.log("[Auth] User found. Verified:", user.isVerified);

          if (!user.isVerified) {
            console.error("[Auth] User not verified:", normalizedEmail);
            throw new Error("Please verify your email first");
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );
          console.log("[Auth] Password valid:", isValid);

          if (!isValid) {
            console.error("[Auth] Password mismatch for:", normalizedEmail);
            throw new Error("Invalid email or password");
          }

          console.log("[Auth] Authorization successful for:", normalizedEmail);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("[Auth] Authorization error:", error.message);
          throw error;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
