import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "TestPilot AI",
  description: "AI-assisted QA test case generation, grounded in your PRD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
