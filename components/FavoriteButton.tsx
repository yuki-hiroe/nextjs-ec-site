"use client";

import { useFavorites } from "@/contexts/FavoritesContext";
import { useState } from "react";

type FavoriteButtonProps = {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    slug: string;
  };
};

export default function FavoriteButton({ product }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");

  const favorite = isFavorite(product.id);

  const handleToggle = () => {
    toggleFavorite(product);
    setMessage(favorite ? "お気に入りから削除しました" : "お気に入りに追加しました");
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className={`rounded-full border px-8 py-3 text-sm font-semibold transition ${
          favorite
            ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
            : "border-slate-300 text-slate-900 hover:border-slate-900"
        }`}
        aria-label={favorite ? "お気に入りから削除" : "お気に入りに追加"}
      >
        {favorite ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 fill-current"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clipRule="evenodd"
              />
            </svg>
            お気に入り済み
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            お気に入りに追加
          </span>
        )}
      </button>
      {showMessage && (
        <div className="absolute -top-12 left-0 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
}

