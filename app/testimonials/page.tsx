import type { Metadata } from "next";
import Link from "next/link";
import TestimonialForm from "@/components/TestimonialForm";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "お客様の声 | Intercambio",
  description: "Intercambioをご利用いただいたお客様の声をご覧いただけます。",
};

// データベースから承認済みのお客様の声を取得
async function getTestimonials() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        isApproved: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        comment: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return testimonials;
  } catch (error) {
    console.error("お客様の声取得エラー:", error);
    return [];
  }
}

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <div className="space-y-10">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">お客様の声</span>
      </nav>

      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Voices</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">お客様の声</h1>
        <p className="mt-3 text-slate-600">
          Intercambioをご利用いただいたお客様の声をご覧いただけます。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* お客様の声一覧 */}
        <div className="lg:col-span-2">
          {testimonials.length > 0 ? (
            <div className="space-y-6">
              {testimonials.map((testimonial) => (
                <blockquote
                  key={testimonial.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm leading-relaxed text-slate-700">
                    "{testimonial.comment}"
                  </p>
                  <footer className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-900">
                        {testimonial.name}
                      </p>
                      {testimonial.role && (
                        <p className="mt-1 text-xs text-slate-500">{testimonial.role}</p>
                      )}
                    </div>
                    <time className="text-xs text-slate-400">
                      {new Date(testimonial.createdAt).toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </footer>
                </blockquote>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-12 text-center">
              <p className="text-slate-600">まだお客様の声がありません</p>
              <p className="mt-2 text-sm text-slate-500">
                最初のお客様の声を投稿してみませんか？
              </p>
            </div>
          )}
        </div>

        {/* 投稿フォーム */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              あなたの声を聞かせてください
            </h2>
            <p className="text-xs text-slate-600 mb-6">
              ご利用いただいた感想やご意見をお聞かせください。管理者の承認後に公開されます。
            </p>
            <TestimonialForm />
          </div>
        </div>
      </div>
    </div>
  );
}

