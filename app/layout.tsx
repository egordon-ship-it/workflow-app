import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Root layout — deliberately minimal: no sidebar, no top bar. The app
 * shell (Sidebar + TopBar) lives in the `(shell)` route-group layout so
 * unauthenticated routes (e.g. a future /sign-in) can opt out simply by
 * living outside the group.
 */
export const metadata: Metadata = {
  title: "Email Workflows | Dynamic Media",
  description:
    "Single source of truth for Dynamic Media email workflows across departments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
