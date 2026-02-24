import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoinDCX Partner Portal",
  description: "Business Partner Portal for CoinDCX - Manage your crypto assets partnership",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
