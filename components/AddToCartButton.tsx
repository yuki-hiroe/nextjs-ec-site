"use client";

import { useCart } from "@/contexts/CartContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useState } from "react";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    price: string;
    image: string;
    slug?: string;
    stock?: number;
  };
  fullWidth?: boolean;
};

export default function AddToCartButton({ product, fullWidth = false }: AddToCartButtonProps) {
  const { addToCart, items } = useCart();
  const { getStock, checkStock } = useInventory();
  const [isAdding, setIsAdding] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentStock = getStock(product.id);
  const cartItem = items.find((item) => item.id === product.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = currentStock <= 0;
  const canAddMore = checkStock(product.id, cartQuantity + 1);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      setErrorMessage("在庫切れです");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    if (!canAddMore) {
      setErrorMessage(`在庫が不足しています（残り${currentStock}点）`);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setIsAdding(true);
    setErrorMessage("");
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    });
    setShowMessage(true);
    setTimeout(() => {
      setIsAdding(false);
      setShowMessage(false);
    }, 1500);
  };

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        onClick={handleAddToCart}
        disabled={isAdding || isOutOfStock || !canAddMore}
        className={`rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${
          fullWidth ? "w-full px-4" : ""
        }`}
      >
        {isOutOfStock ? "在庫切れ" : !canAddMore ? "在庫不足" : isAdding ? "追加中..." : "カートに入れる"}
      </button>
      {showMessage && (
        <div className="absolute -top-12 left-0 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          カートに追加しました
        </div>
      )}
      {errorMessage && (
        <div className="absolute -top-12 left-0 rounded-lg bg-red-500 px-4 py-2 text-sm text-white shadow-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

