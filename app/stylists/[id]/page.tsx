import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StylistRatingForm from "@/components/StylistRatingForm";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const stylist = await prisma.stylist.findUnique({
    where: { id },
    select: { name: true, nameEn: true },
  });

  if (!stylist) {
    return {
      title: "スタイリストが見つかりません | Intercambio",
    };
  }

  return {
    title: `${stylist.name} | スタイリスト | Intercambio`,
    description: `${stylist.name}のプロフィールページです。`,
  };
}

async function getStylistData(id: string) {
  try {
    const stylist = await prisma.stylist.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        nameEn: true,
        bio: true,
        specialties: true,
        image: true,
        email: true,
        createdAt: true,
      },
    });

    if (!stylist) {
      return null;
    }

    // 評価データを取得
    let ratings: any[] = [];
    let avgRating = { _avg: { rating: null as number | null }, _count: { id: 0 } };

    // Prisma ClientにstylistRatingが存在するか確認
    if (prisma.stylistRating) {
      try {
        ratings = await prisma.stylistRating.findMany({
          where: { stylistId: id },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10, // 最新10件
        });

        // 平均評価を計算
        avgRating = await prisma.stylistRating.aggregate({
          where: { stylistId: id },
          _avg: { rating: true },
          _count: { id: true },
        });
      } catch (error) {
        console.error("評価データ取得エラー:", error);
        // エラーが発生した場合は空の配列とデフォルト値を返す
        ratings = [];
        avgRating = { _avg: { rating: null }, _count: { id: 0 } };
      }
    } else {
      console.warn("prisma.stylistRatingが存在しません。Prisma Clientを再生成してください。");
    }

    return {
      ...stylist,
      ratings,
      averageRating: avgRating._avg.rating || 0,
      ratingCount: avgRating._count.id || 0,
    };
  } catch (error) {
    console.error("スタイリストデータ取得エラー:", error);
    return null;
  }
}

export default async function StylistProfilePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const stylistData = await getStylistData(id);

  if (!stylistData) {
    return (
      <div className="space-y-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-600">スタイリストが見つかりませんでした。</p>
          <Link
            href="/stylists"
            className="mt-4 inline-block text-sm font-semibold text-slate-900 hover:underline"
          >
            スタイリスト一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const specialties = Array.isArray(stylistData.specialties)
    ? stylistData.specialties
    : typeof stylistData.specialties === "string"
    ? JSON.parse(stylistData.specialties)
    : [];

  // ユーザーが既に評価しているか確認
  let userRating = null;
  if (session?.user?.id && prisma.stylistRating) {
    try {
      userRating = await prisma.stylistRating.findUnique({
        where: {
          stylistId_userId: {
            stylistId: id,
            userId: session.user.id,
          },
        },
      });
    } catch (error) {
      console.error("ユーザー評価取得エラー:", error);
    }
  }

  return (
    <div className="space-y-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/stylists" className="hover:text-slate-900">
          スタイリスト
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">{stylistData.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* 左側: プロフィール情報 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-6">
              {stylistData.image && stylistData.image.trim() !== "" && stylistData.image.startsWith("http") ? (
                <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
                  <Image
                    src={stylistData.image}
                    alt={stylistData.name || "スタイリスト"}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              ) : (
                <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-4xl font-semibold text-slate-600">
                  {(stylistData.name || "S").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-900">{stylistData.name}</h1>
                {stylistData.nameEn && (
                  <p className="mt-1 text-lg text-slate-500">{stylistData.nameEn}</p>
                )}
                {stylistData.averageRating > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(stylistData.averageRating)
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
                    <span className="text-sm font-semibold text-slate-900">
                      {stylistData.averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-500">
                      ({stylistData.ratingCount}件の評価)
                    </span>
                  </div>
                )}
                <p className="mt-4 text-slate-700 leading-relaxed">{stylistData.bio}</p>
                {specialties.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {specialties.map((specialty: string, index: number) => (
                      <span
                        key={index}
                        className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/contact?stylistId=${stylistData.id}&inquiryType=styling`}
                  className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  このスタイリストに相談する
                </Link>
              </div>
            </div>
          </div>

          {/* 評価一覧 */}
          {stylistData.ratings.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">評価・レビュー</h2>
              <div className="space-y-4">
                {stylistData.ratings.map((rating: { id: string; rating: number; comment: string | null; createdAt: Date; user: { id: string; name: string; image: string | null } }) => (
                  <div key={rating.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {rating.user.image ? (
                            <div className="relative h-8 w-8 overflow-hidden rounded-full">
                              <Image
                                src={rating.user.image}
                                alt={rating.user.name}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                              {rating.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm font-medium text-slate-900">{rating.user.name}</span>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= rating.rating ? "text-amber-400" : "text-slate-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-slate-700 leading-relaxed">{rating.comment}</p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(rating.createdAt).toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右側: 評価フォーム */}
        <div className="lg:col-span-1">
          {session?.user ? (
            userRating ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">あなたの評価</h2>
                <div className="space-y-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-5 w-5 ${
                          star <= userRating.rating ? "text-amber-400" : "text-slate-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {userRating.comment && (
                    <p className="text-sm text-slate-700">{userRating.comment}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">評価を投稿</h2>
                <StylistRatingForm stylistId={id} />
              </div>
            )
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">評価を投稿</h2>
              <p className="text-sm text-slate-600 mb-4">
                評価を投稿するにはログインが必要です。
              </p>
              <Link
                href="/login"
                className="inline-block rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                ログインする
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

