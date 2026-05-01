import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import dynamic from 'next/dynamic';

const SummaryPanel = dynamic(() => import("@/components/layout/SummaryPanel"), {
  ssr: true,
});
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import QueryProvider from '@/providers/QueryProvider';

const appBasePath = process.env.NODE_ENV === 'production' ? '/life-ops' : '';

export const metadata: Metadata = {
  title: "Life OPS",
  description: "个人控制台 - 行动与节奏",
  icons: {
    icon: `${appBasePath}/icon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased font-sans text-body bg-bg-primary text-text-primary transition-colors duration-300">
        <QueryProvider>
          <AuthProvider>
            <AuthGuard>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-(--sidebar-width) mr-(--summary-width)">
                  <div className="max-w-6xl mx-auto py-page-y px-page-x">
                    {children}
                  </div>
                </main>
                <SummaryPanel />
              </div>
            </AuthGuard>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
