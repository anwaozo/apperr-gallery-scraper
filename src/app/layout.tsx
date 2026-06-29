import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gallery Scraper | Apperr",
  description: "Download all images from any public gallery page — built by Apperr",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
