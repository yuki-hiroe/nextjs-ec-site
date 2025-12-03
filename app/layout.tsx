import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { SessionProvider } from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Intercambio",
  description: "日常を少し上質にするミニマルセレクトショップ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <SessionProvider>
          <InventoryProvider>
            <CartProvider>
              <FavoritesProvider>
                <Header />
                <main className="min-h-screen px-6 py-12">{children}</main>
                <Footer />
              </FavoritesProvider>
            </CartProvider>
          </InventoryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
