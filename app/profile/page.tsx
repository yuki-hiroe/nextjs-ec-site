import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth"; 
import { authOptions } from "@/lib/auth"; 
import { prisma } from "@/lib/prisma"; 
import { redirect } from "next/navigation";

type Stylist = {
  id: string;
  name: string;
  nameEn: string | null;
  image: string | null;
  bio: string;
  specialties: string[];
  averageRating: number;
  ratingCount: number;
};
// マイページで相談したスタイリストを取得
async function getProfileStylists(userId: string): Promise<Stylist[]> {
  // 相談したスタイリストを取得
  const inquiries = await prisma.inquiry.findMany({
    where: {
      userId,
      stylistId: { not: null },
      inquiryType: "styling",
    },
    include: {
      stylist: {
        select: {
          id: true,
          name: true,
          nameEn: true,
          image: true,
          bio: true,
          specialties: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const uniqueStylistIds = new Set<string>();
  const uniqueStylistlists: Array<{
    id: string;
    name: string;
    nameEn: string | null;
    image: string | null;
    bio: string;
    specialties: unknown;
  }> = [];

  for (const inquiry of inquiries) {
    if (inquiry.stylist && !uniqueStylistIds.has(inquiry.stylist.id)) {
      uniqueStylistIds.add(inquiry.stylist.id);
      uniqueStylistlists.push(inquiry.stylist);
    }
  }

  const stylistsWithRatings = await Promise.all(uniqueStylistlists.map(async (stylist) => {
    const avgRating = await prisma.stylistRating.aggregate({
      where: { stylistId: stylist.id },
      _avg: { rating: true },
      _count: { id: true },
    });

    const specialties = Array.isArray(stylist.specialties) 
    ? stylist.specialties 
    : typeof stylist.specialties === "string" 
    ? JSON.parse(stylist.specialties) 
    : [];

    return {
      ...stylist,
      specialties,
      averageRating: avgRating._avg.rating || 0,
      ratingCount: avgRating._count.id || 0,
    };
  }));

  return stylistsWithRatings;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const stylists = await getProfileStylists(session.user.id);

  return (
    <div className="space-y-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">マイページ</span>
      </nav>

      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">マイページ</h1>
        <p className="mt-3 text-slate-600">
          あなたが相談したスタイリスト一覧を確認できます
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stylists.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-600">まだ相談したスタイリストがありません</p>
            <Link
              href="/stylists"
              className="mt-4 inline-block text-sm font-semibold text-slate-900 hover:underline"
            >
              スタイリストを探す
            </Link>
          </div>
        ) : (
          stylists.map((stylist) => (
            <Link
              key={stylist.id}
              href={`/stylists/${stylist.id}`}
              className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
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
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
                    {(stylist.name || "S").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-slate-600 transition">
                    {stylist.name || "スタイリスト"}
                  </h3>
                  {stylist.nameEn && stylist.nameEn.trim() !== "" && (
                    <p className="mt-1 text-sm text-slate-500">{stylist.nameEn}</p>
                  )}
                  {stylist.averageRating > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(stylist.averageRating)
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
                      {stylist.specialties.slice(0, 2).map((specialty, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                        >
                          {specialty}
                        </span>
                      ))}
                      {stylist.specialties.length > 2 && (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          +{stylist.specialties.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

