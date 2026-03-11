import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta広告 一括入稿ツール",
  description: "Meta広告の一括入稿・管理ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-[var(--background)]">
            <header className="border-b bg-white px-6 py-3">
              <div className="mx-auto flex max-w-6xl items-center justify-between">
                <h1 className="text-xl font-bold text-[var(--primary)]">
                  Meta広告 一括入稿ツール
                </h1>
                <nav className="flex gap-4 text-sm">
                  <Link href="/" className="hover:text-[var(--primary)]">
                    ホーム
                  </Link>
                  <Link href="/builder" className="hover:text-[var(--primary)]">
                    入稿
                  </Link>
                  <Link href="/review" className="hover:text-[var(--primary)]">
                    レビュー
                  </Link>
                  <Link href="/history" className="hover:text-[var(--primary)]">
                    履歴
                  </Link>
                </nav>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
