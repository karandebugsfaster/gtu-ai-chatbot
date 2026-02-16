// // ✅ NEW — accepts pre-fetched server session, no client round-trip
// 'use client';
// import { SessionProvider } from 'next-auth/react';

// export default function Providers({ children, session }) {
//   return (
//     <SessionProvider 
//       session={session}
//       refetchOnWindowFocus={true}
//       refetchInterval={30}
//     >
//       {children}
//     </SessionProvider>
//   );
// }
'use client';
import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      {children}
    </SessionProvider>
  );
}