import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";
import { AppProviders } from "@/providers/app-providers";
import { MainHeader } from "@/components/layout/main-header";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "OrderMatrix | Online Ordering Dashboard",
  description: "Frontend for online ordering and order management system"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <AppProviders>
          <div className="min-h-screen">
            <MainHeader />
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
