import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "CoinDCX Partner Portal",
  description:
    "Business Partner Portal for CoinDCX - Manage your crypto assets partnership",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

