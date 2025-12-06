"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Stylist = {
  id: string;
  name: string;
  nameEn?: string;
  bio: string;
  specialties: string[];
  image?: string;
  email: string;
  averageRating?: number | null;
  ratingCount?: number;
};

function StylistsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const selectedStylistId = searchParams.get("select");

  useEffect(() => {
    // スタイリスト一覧を取得
    fetch("/api/stylists")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setStylists(data);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("スタイリスト取得エラー:", error);
        setIsLoading(false);
      });
  }, []);

  const handleSelectStylist = (stylistId: string) => {
    // スタイリストを選択してcontactページに遷移
    router.push(`/contact?stylistId=${stylistId}&inquiryType=styling`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Stylists</span>
      </nav>

      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Stylists</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">スタイリストを選ぶ</h1>
        <p className="mt-3 text-slate-600">
          お客様に合ったコーディネートを無料でご提案いたします。お気に入りのスタイリストを選んで、ご相談ください。
        </p>
      </div>

      {stylists.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">スタイリストが見つかりませんでした。</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className={`group rounded-3xl border p-6 transition hover:-translate-y-1 hover:shadow-lg ${
                selectedStylistId === stylist.id
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                {stylist.image && stylist.image.trim() !== "" && stylist.image.startsWith("http") ? (
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
                    <Image
                      src={stylist.image}
                      alt={stylist.name || "スタイリスト"}
                      fill
                      className="object-cover"
                      sizes="80px"
                      unoptimized={!stylist.image.includes("images.unsplash.com")}
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
                    {(stylist.name || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/stylists/${stylist.id}`}
                    className="text-lg font-semibold text-slate-900 hover:text-slate-600 hover:underline transition"
                  >
                    {stylist.name || "スタイリスト"}
                  </Link>
                  {stylist.nameEn && stylist.nameEn.trim() !== "" && (
                    <p className="mt-1 text-sm text-slate-500">{stylist.nameEn}</p>
                  )}
                  {stylist.averageRating !== null && 
                   stylist.averageRating !== undefined && 
                   stylist.averageRating > 0 && 
                   stylist.ratingCount !== undefined && 
                   stylist.ratingCount > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(stylist.averageRating || 0)
                                ? "text-amber-400"
                                : "text-slate-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-900">
                        {stylist.averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({stylist.ratingCount}件)
                      </span>
                    </div>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{stylist.bio || ""}</p>
                  {Array.isArray(stylist.specialties) && stylist.specialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {stylist.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSelectStylist(stylist.id)}
                className="mt-6 w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                このスタイリストに相談する
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">
          スタイリストを選ばずに相談したい場合は、
          <Link href="/contact" className="text-slate-900 underline hover:no-underline">
            こちらからお問い合わせください
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function StylistsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <StylistsPageContent />
    </Suspense>
  );
}

