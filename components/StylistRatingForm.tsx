"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type StylistRatingFormProps = {
  stylistId: string;
  inquiryId?: string;
  onSuccess?: () => void;
};

export default function StylistRatingForm({
  stylistId,
  inquiryId,
  onSuccess,
}: StylistRatingFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setMessage({
        type: "error",
        text: "評価を選択してください",
      });
      return;
    }

    if (!session?.user?.id) {
      setMessage({
        type: "error",
        text: "ログインが必要です",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/stylists/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stylistId,
          rating,
          comment: comment.trim() || null,
          inquiryId: inquiryId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "評価の投稿に失敗しました");
      }

      setMessage({
        type: "success",
        text: data.message || "評価を投稿しました",
      });

      // フォームをリセット
      setRating(0);
      setComment("");

      if (onSuccess) {
        onSuccess();
      } else {
        // ページをリロードして評価を反映
        router.refresh();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "評価の投稿に失敗しました",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          評価 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <svg
                className={`h-8 w-8 transition ${
                  star <= (hoveredRating || rating)
                    ? "text-amber-400"
                    : "text-slate-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            {rating === 5
              ? "最高です！"
              : rating === 4
              ? "とても良い"
              : rating === 3
              ? "普通"
              : rating === 2
              ? "やや不満"
              : "不満"}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-slate-700 mb-2">
          コメント（任意）
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-900 focus:outline-none"
          placeholder="ご意見・ご感想をお聞かせください"
          maxLength={500}
        />
        <p className="mt-1 text-xs text-slate-500">{comment.length}/500文字</p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "投稿中..." : "評価を投稿する"}
      </button>
    </form>
  );
}

