"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: string;
  image: string;
  slug?: string; // 商品詳細ページへのリンク用
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void; //何も返さない
  updateQuantity: (id: string, quantity: number) => void; //何も返さない
  removeFromCart: (id: string) => void; //何も返さない
  clearCart: () => void; //何も返さない
  getTotalPrice: () => number; //合計金額を返す
  getTotalItems: () => number; //合計商品数を返す
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // カートをローカルストレージに保存する『カート保存機』
  useEffect(() => {
    // カートをローカルストレージに保存
    setIsMounted(true);
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
      }
    }
  }, []);

  // カートをローカルストレージに保存する『カート保存機』
  useEffect(() => {
    // カートをローカルストレージに保存
    if (isMounted) {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items, isMounted]);

  // カートに商品を追加する『カート追加機』
  const addToCart = (item: Omit<CartItem, "quantity">) => {
    // カートに商品を追加
    setItems((prevItems) => {
      // カートに既に商品があるかどうかを判定
      const existingItem = prevItems.find((i) => i.id === item.id);
      // 既に商品がある場合は数量を増やす
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      // 商品がない場合は新規に追加
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  // カートの商品数量を更新する『カート数量更新機』
  const updateQuantity = (id: string, quantity: number) => {
    // 商品数量を更新
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    // 商品数量を更新
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // カートの商品を削除する『カート削除機』
  const removeFromCart = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // カートをクリアする『カートクリア機』
  const clearCart = () => {
    setItems([]);
  };

  // カートの合計金額を取得する『カート合計金額取得機』
  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const price = parseInt(item.price.replace(/[¥,]/g, ""), 10);
      return total + price * item.quantity;
    }, 0);
  };

  // カートの合計商品数を取得する『カート合計商品数取得機』
  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // カートを提供する『カート提供機』
  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// カートを使用する『カート使用機』
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

