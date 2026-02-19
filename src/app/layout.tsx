import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProvider from "@/components/auth/SessionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leaderboards - Construction Workforce Management",
  description: "Gamified productivity tracking and leaderboards for construction teams. Track manpower, compete for top rankings, and boost team performance.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Leaderboards - Construction Workforce Management",
    description: "Gamified productivity tracking and leaderboards for construction teams",
    images: [
      {
        url: "/logo-512.png",
        width: 512,
        height: 512,
        alt: "Leaderboards Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Leaderboards - Construction Workforce Management",
    description: "Gamified productivity tracking and leaderboards for construction teams",
    images: ["/logo-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
