import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Empyr — AI-generated sites, on demand",
  description:
    "Empyr turns a prompt into a ready-to-launch site. Describe your business, get a brand-ready layout in seconds.",
};

/** Avoid static prerender of Clerk-wrapped pages without a request context. */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk = Boolean(
    publishableKey && !publishableKey.includes("placeholder"),
  );

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {hasClerk ? (
          <ClerkProvider publishableKey={publishableKey}>
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
