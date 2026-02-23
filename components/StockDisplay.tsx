"use client";

import { useInventory } from "@/contexts/InventoryContext";
import { useEffect } from "react";

type StockDisplayProps = {
  productId: string;
  initialStock?: number;
};

export default function StockDisplay({ productId, initialStock }: StockDisplayProps) {
  const { getStock, hasFetchedStock, refreshStock } = useInventory();
  const currentStock = getStock(productId);
  // API取得済みならその値を使う。未取得ならinitialStockをフォールバック（取得後に上書き）
  const stock = hasFetchedStock(productId) ? currentStock : (initialStock ?? 0);

  // コンポーネントマウント時に在庫情報を取得
  useEffect(() => {
    if (productId && !hasFetchedStock(productId) && initialStock !== undefined) {
      refreshStock(productId);
    }
  }, [productId, hasFetchedStock, initialStock, refreshStock]);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        stock > 10
          ? "bg-emerald-100 text-emerald-800"
          : stock > 0
          ? "bg-amber-100 text-amber-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {stock > 0 ? `在庫あり (残り${stock}点)` : "在庫切れ"}
    </span>
  );
}

