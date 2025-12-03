"use client";

import { useState, useEffect } from "react";
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
};

export default function StylistsPage() {
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
                  <h3 className="text-lg font-semibold text-slate-900">{stylist.name || "スタイリスト"}</h3>
                  {stylist.nameEn && stylist.nameEn.trim() !== "" && (
                    <p className="mt-1 text-sm text-slate-500">{stylist.nameEn}</p>
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

