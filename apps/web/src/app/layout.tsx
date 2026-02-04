import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import SummaryPanel from "@/components/layout/SummaryPanel";
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: "Life OPS",
  description: "个人控制台 - 行动与节奏",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased font-sans bg-bg-primary text-text-primary transition-colors duration-300">
        <AuthProvider>
          <AuthGuard>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-[var(--sidebar-width)] mr-[var(--summary-width)]">
                <div className="max-w-6xl mx-auto py-10 px-6">
                  {children}
                </div>
              </main>
              <SummaryPanel />
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
