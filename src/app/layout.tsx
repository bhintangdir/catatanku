import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CatatanKu",
  description: "Aplikasi pencatatan laporan keuangan dan penjualan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} min-h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 flex flex-col`}>
        <Shell>
          {children}
        </Shell>
      </body>
    </html>
  );
}
