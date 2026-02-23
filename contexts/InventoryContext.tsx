"use client";

import React, { createContext, useContext, useState, useCallback } from "react";


type Inventory = {
  [productId: string]: number;
};

type InventoryContextType = {
  inventory: Inventory;
  getStock: (productId: string) => number;
  hasFetchedStock: (productId: string) => boolean;
  reduceStock: (productId: string, quantity: number) => Promise<boolean>;
  checkStock: (productId: string, quantity: number) => boolean;
  refreshStock: (productId: string) => Promise<void>;
  isLoading: boolean;
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<Inventory>({});
  const [isLoading, setIsLoading] = useState(false);

  // 在庫情報をAPIから取得
  const fetchStock = useCallback(async (productId: string): Promise<number> => {
    try {
      const response = await fetch(`/api/inventory/${productId}`);
      if (!response.ok) {
        console.error("在庫取得エラー:", response.statusText);
        return 0;
      }
      const data = await response.json();
      return data.stock || 0;
    } catch (error) {
      console.error("在庫取得エラー:", error);
      return 0;
    }
  }, []);

  // 在庫を更新（API経由）
  const updateStock = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/inventory/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("在庫更新エラー:", error);
        return false;
      }

      const data = await response.json();
      // ローカル状態を更新
      setInventory((prev) => ({
        ...prev,
        [productId]: data.stock,
      }));
      return true;
    } catch (error) {
      console.error("在庫更新エラー:", error);
      return false;
    }
  }, []);
  // 在庫を取得する『在庫取得機』
  // 在庫が取得できなかった場合は0を返す
  const getStock = (productId: string): number => {
    return inventory[productId] ?? 0;
  };

  // 在庫をAPIから取得済みかどうか（未取得ならinitialStockを使う判定に使用）
  const hasFetchedStock = useCallback((productId: string): boolean => {
    return productId in inventory;
  }, [inventory]);
  // 注文しようとしている数が、在庫の範囲内かどうかを判定する『判定機』
  // true: 在庫が足りている、false: 在庫が足りていない
  const checkStock = (productId: string, quantity: number): boolean => {
    const currentStock = getStock(productId);
    return currentStock >= quantity;
  };
  // 在庫を減らす『在庫減少機』
  // 在庫が減らせなかった場合はfalseを返す
  const reduceStock = async (productId: string, quantity: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await updateStock(productId, quantity);
      return success;
    } finally {
      setIsLoading(false);
    }
  };
  // 在庫を更新する『在庫更新機』
  // 在庫が更新できなかった場合はfalseを返す
  const refreshStock = async (productId: string): Promise<void> => {
    const stock = await fetchStock(productId);
    setInventory((prev) => ({
      ...prev,
      [productId]: stock,
    }));
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        getStock,
        hasFetchedStock,
        reduceStock,
        checkStock,
        refreshStock,
        isLoading,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}

