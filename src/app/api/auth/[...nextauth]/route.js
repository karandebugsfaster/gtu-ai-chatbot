// import NextAuth from 'next-auth';
// import { authOptions } from '@/lib/auth/authOptions';

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';  // ← already exists in your structure!

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };