import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuakeWatch Pro - Real-time Earthquake Monitoring",
  description: "Advanced real-time earthquake monitoring system with interactive maps, filtering, and alert notifications. Track global seismic activity with USGS data.",
  keywords: ["earthquake", "seismic", "monitoring", "USGS", "real-time", "alerts", "geology"],
  authors: [{ name: "QuakeWatch Pro" }],
  creator: "QuakeWatch Pro",
  metadataBase: new URL('https://quakewatch-pro.vercel.app'),
  openGraph: {
    title: "QuakeWatch Pro - Real-time Earthquake Monitoring",
    description: "Advanced real-time earthquake monitoring system with interactive maps and alerts",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuakeWatch Pro - Real-time Earthquake Monitoring", 
    description: "Advanced real-time earthquake monitoring system with interactive maps and alerts",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://earthquake.usgs.gov" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-950`}
      >
        <div id="root" role="main" aria-label="QuakeWatch Pro Application">
          {children}
        </div>
        <div id="modal-root" />
      </body>
    </html>
  );
}
