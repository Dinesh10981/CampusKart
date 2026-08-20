import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusKart",
  description: "Buy, sell, chat and negotiate safely with students on your campus.",
  openGraph: {
    title: "CampusKart — Your Campus Marketplace",
    description: "Buy, sell, chat and negotiate safely with students on your campus.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CampusKart — Your Campus Marketplace",
    description: "Buy, sell, chat and negotiate safely with students on your campus.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
