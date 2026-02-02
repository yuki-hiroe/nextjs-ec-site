"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  // スタイリストは NextAuth セッションで判定（localStorage 廃止）
  const stylist =
    session?.user?.role === "stylist"
      ? { name: session.user.name || "", email: session.user.email || "" }
      : null;

  // スタイリストダッシュボードページかどうかを判定（/stylistsは除外）
  const isStylistDashboard = pathname?.startsWith("/stylist") && !pathname?.startsWith("/stylists");
  // 管理者画面ページかどうかを判定
  const isAdminDashboard = pathname?.startsWith("/admin");
  // 制限されたページ（スタイリストダッシュボードまたは管理者画面）かどうかを判定
  const isRestrictedPage = isStylistDashboard || isAdminDashboard;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
    setIsMenuOpen(false);
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // 未読返信の件数を取得（ユーザー: お問い合わせ未読 / スタイリスト: 返信未読）
  useEffect(() => {
    if (session?.user?.role === "stylist") {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch("/api/stylists/unread-replies");
          const data = await response.json();
          if (data && !data.error) {
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (error) {
          console.error("未読返信件数取得エラー:", error);
        }
      };
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(interval);
    }
    if (isAuthenticated && user?.email) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch(
            `/api/inquiries/unread-count?email=${encodeURIComponent(user.email || "")}`
          );
          const data = await response.json();
          if (data && !data.error) {
            setUnreadCount(data.unreadCount || 0);
          }
        } catch (error) {
          console.error("未読返信件数取得エラー:", error);
        }
      };

      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 5000);
      const handleFocus = () => fetchUnreadCount();
      window.addEventListener("focus", handleFocus);
      const handleUnreadUpdate = () => fetchUnreadCount();
      window.addEventListener("unreadCountUpdate", handleUnreadUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", handleFocus);
        window.removeEventListener("unreadCountUpdate", handleUnreadUpdate);
      };
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.email, session?.user?.role]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex items-center justify-between px-4 py-3 sm:px-6 md:px-10">
        {isRestrictedPage ? (
          <h1 className="text-lg font-semibold tracking-[0.3em] uppercase text-slate-900">
            Intercambio
          </h1>
        ) : (
        <Link href="/" className="text-lg font-semibold tracking-[0.3em] uppercase">
          <h1>Intercambio</h1>
        </Link>
        )}
        
        {/* デスクトップナビゲーション */}
        <nav className="hidden md:flex items-center gap-5 text-sm text-slate-600">
          {!isRestrictedPage && (
            <>
          <Link href="/products"><em>Products</em></Link>
          <Link href="/stylists"><em>Stylists</em></Link>
          <Link href="/favorites"><em>Favorites</em></Link>
          <Link href="/cart"><em>Cart</em></Link>
          <Link href="/contact"><em>Contact</em></Link>
            </>
          )}
          {isAuthenticated || stylist ? (
            <>
              {isAuthenticated && !isAdminDashboard && !isStylistDashboard && (
            <>
              <span className="text-slate-400">|</span>
                  <Link href="/inquiries" className="relative text-slate-600 hover:text-slate-900">
                    {unreadCount > 0 && (
                        <span className="relative ml-2 inline-flex items-center">
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                          </span>
                          <span className="ml-3 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white min-w-[1.25rem]">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        </span>
                    )}
                お問い合わせ履歴
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-slate-900">
                マイページ
              </Link>
                </>
              )}
              {stylist && !isStylistDashboard && (
                <>
                  <Link href="/stylist" className="text-slate-600 hover:text-slate-900">
                    スタイリストダッシュボード
                  </Link>
                </>
              )}
              <span className="text-slate-900">
                {stylist ? `${stylist.name}さん` : `${user?.name}さん`}
              </span>
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              {/* <span className="text-slate-400">|</span> */}
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                ログイン
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-slate-300 px-4 py-2 text-slate-900 transition hover:border-slate-900"
              >
                新規登録
              </Link>
            </>
          )}
        </nav>

        {/* ハンバーガーメニューボタン（モバイル）- スタイリストダッシュボード・管理者画面では表示しない */}
        {!isRestrictedPage && (
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
          aria-label="メニューを開く"
        >
          {isMenuOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
        )}
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* メニューパネル */}
          <nav className="fixed top-[57px] left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-50 md:hidden max-h-[calc(100vh-57px)] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              {!isRestrictedPage && (
                <>
              <Link
                href="/products"
                onClick={handleLinkClick}
                className="block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
              >
                <em>Products</em>
              </Link>
              <Link
                href="/stylists"
                onClick={handleLinkClick}
                className="block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
              >
                <em>Stylists</em>
              </Link>
              <Link
                href="/favorites"
                onClick={handleLinkClick}
                className="block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
              >
                <em>Favorites</em>
              </Link>
              <Link
                href="/cart"
                onClick={handleLinkClick}
                className="block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
              >
                <em>Cart</em>
              </Link>
              <Link
                href="/contact"
                onClick={handleLinkClick}
                className="block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
              >
                <em>Contact</em>
              </Link>
              
              <div className="border-t border-slate-200 my-2" />
                </>
              )}
              
              {isAuthenticated || stylist ? (
                <>
                  <div className="px-4 py-3 text-sm text-slate-900 font-medium">
                    {stylist ? `${stylist.name}さん` : `${user?.name}さん`}
                  </div>
                  {isAuthenticated && !isAdminDashboard && !isStylistDashboard && (
                    <>
                      <Link
                        href="/inquiries"
                        onClick={handleLinkClick}
                        className="relative block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
                      >
                        <span className="flex items-center justify-between">
                          <span>お問い合わせ履歴</span>
                          {unreadCount > 0 && (
                            <span className="relative inline-flex items-center ml-2">
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                              </span>
                              <span className="ml-3 inline-flex items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white min-w-[1.25rem]">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            </span>
                          )}
                        </span>
                      </Link>
                      <Link
                        href="/profile"
                        onClick={handleLinkClick}
                        className="block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
                      >
                        マイページ
                      </Link>
                    </>
                  )}
                  {stylist && !isStylistDashboard && (
                    <Link
                      href="/stylist"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
                  >
                      スタイリストダッシュボード
                  </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/register"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-sm text-slate-900 hover:bg-slate-50 rounded-lg transition text-center border border-slate-300 hover:border-slate-900"
                  >
                    新規登録
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}