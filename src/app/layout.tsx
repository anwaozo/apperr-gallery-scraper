import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = "https://apperr-gallery-scraper.netlify.app";

export const metadata: Metadata = {
  title: "Image Extractor | Apperr Designs",
  description:
    "Download every image from any public gallery page in one click. A free tool built by Apperr Designs — Houston's on-demand tech partner.",
  keywords: [
    "image extractor",
    "gallery downloader",
    "bulk image download",
    "web scraper",
    "Apperr Designs",
    "Houston tech",
  ],
  authors: [{ name: "Apperr Designs", url: "https://apperr.com" }],
  creator: "Apperr Designs",
  publisher: "Apperr Designs",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    title: "Image Extractor | Apperr Designs",
    description:
      "Download every image from any public gallery page in one click — powered by Apperr Designs.",
    siteName: "Apperr Image Extractor",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Apperr Designs — Image Extractor Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Extractor | Apperr Designs",
    description:
      "Download every image from any public gallery page in one click — powered by Apperr Designs.",
    images: ["/og-image.png"],
    creator: "@apperrdesigns",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
