import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life OPS",
  description: "健身与财务记录、查看和 CLI 数据服务",
  icons: {
    icon: "/icon.svg",
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
        {children}
      </body>
    </html>
  );
}
