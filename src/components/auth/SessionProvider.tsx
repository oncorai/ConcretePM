"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Suppress NextAuth client-side errors in console
    const originalError = console.error;
    console.error = (...args) => {
      if (
        args[0]?.includes?.("[next-auth][error][CLIENT_FETCH_ERROR]") ||
        args[0]?.includes?.("client_fetch_error")
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <NextAuthSessionProvider
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window is focused
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}