import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Revenue Bottleneck Finder | The Kreator Syndicate",
  description:
    "A premium revenue diagnostic from The Kreator Syndicate for coaches, consultants, and course creators.",
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
