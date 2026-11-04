import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZSYSPRO HUB | The Ultimate Workspace for z/OS System Programmers",
  description:
    "Learn, operate, troubleshoot, and grow your career in the IBM Z ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
