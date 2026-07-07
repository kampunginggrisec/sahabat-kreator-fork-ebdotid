import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { ThemeProvider } from "@/shared/presentation/providers/theme-provider";
import { Providers } from "@/shared/infrastructure/query/query-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  // Preload only latin subset for smaller bundle
  preload: true,
  fallback: ["system-ui", "Arial", "sans-serif"],
});

// Shared metadata across all pages — avoids repeating on each route segment
export const metadata: Metadata = {
  title: {
    default: "Sahabat Kreator — AI Social Media Platform",
    template: "%s | Sahabat Kreator",
  },
  description: "AI-powered social media content management platform. Generate captions, schedule posts, and track analytics.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
