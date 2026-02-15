"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type FavoriteItem = {
  id: string;
  name: string;
  price: string;
  image: string;
  slug: string;
};

type FavoritesContextType = {
  favorites: FavoriteItem[];
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // お気に入りをローカルストレージに保存する『お気に入り保存機』
  useEffect(() => {
    // お気に入りをローカルストレージに保存
    setIsMounted(true);
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error("Failed to parse favorites from localStorage", error);
      }
    }
  }, []);

  // お気に入りをローカルストレージに保存する『お気に入り保存機』
  useEffect(() => {
    // お気に入りをローカルストレージに保存
    if (isMounted) {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  }, [favorites, isMounted]);

  // お気に入りに商品を追加する『お気に入り追加機』
  const addToFavorites = (item: FavoriteItem) => {
    // お気に入りに商品を追加
    setFavorites((prev) => {
      // お気に入りに既に商品があるかどうかを判定
      if (prev.some((fav) => fav.id === item.id)) {
        return prev;
      }
      // 商品がない場合は新規に追加
      return [...prev, item];
    });
  };
  // お気に入りを削除する『お気に入り削除機』
  const removeFromFavorites = (id: string) => {
    // お気に入りから商品を削除
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };
  // お気に入りかどうかを判定する『お気に入り判定機』
  const isFavorite = (id: string): boolean => {
    // お気に入りかどうかを判定
    return favorites.some((item) => item.id === id);
  };
  // 未お気に入りならお気に入りを追加す、お気に入り追加済みなら削除を切り替える『お気に入り切り替え機』
  const toggleFavorite = (item: FavoriteItem) => {
    // お気に入りかどうかを判定
    if (isFavorite(item.id)) {
      // お気に入りから商品を削除
      removeFromFavorites(item.id);
    } else {
      // お気に入りに商品を追加
      addToFavorites(item);
    }
  };
  // お気に入りを提供する『お気に入り提供機』
  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

// お気に入りを使用する『お気に入り使用機』
export function useFavorites() {
  // お気に入りを使用できるかどうかを判定する『お気に入り使用判定機』
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}

