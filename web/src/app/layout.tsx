import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WarrSPA Auth — Authentication infrastructure for your SaaS",
  description:
    "Complete auth service with multi-tenancy, API key management, and user analytics. One integration, infinite tenants.",
  keywords: [
    "authentication",
    "SaaS",
    "multi-tenant",
    "API keys",
    "JWT",
    "auth service",
  ],
  authors: [{ name: "WarrSPA" }],
  openGraph: {
    title: "WarrSPA Auth — Authentication infrastructure for your SaaS",
    description:
      "Complete auth service with multi-tenancy, API key management, and user analytics.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
