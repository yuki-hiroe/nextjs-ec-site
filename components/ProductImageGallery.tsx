"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useInventory } from "@/contexts/InventoryContext";

type ProductImageGalleryProps = {
  mainImage: string;
  images: string[];
  productName: string;
  productId?: string;
  initialStock?: number;
};

export default function ProductImageGallery({
  mainImage,
  images,
  productName,
  productId,
  initialStock,
}: ProductImageGalleryProps) {
  const { getStock, hasFetchedStock, refreshStock } = useInventory();
  const currentStock = productId ? getStock(productId) : 1;
  const stock = productId && hasFetchedStock(productId) ? currentStock : (initialStock ?? 1);
  const isSoldOut = productId ? stock <= 0 : false;

  useEffect(() => {
    if (productId && !hasFetchedStock(productId) && initialStock !== undefined) {
      refreshStock(productId);
    }
  }, [productId, hasFetchedStock, initialStock, refreshStock]);
  // 無効なドメイン（depop.com）のみを除外し、それ以外は許可
  // メイン画像が無効なドメインでない限り使用
  const validMainImage = mainImage && !mainImage.includes("depop.com") ? mainImage : (mainImage || "");
  const [selectedImage, setSelectedImage] = useState(validMainImage || mainImage);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // メイン画像とサムネイル画像を結合（重複を除去し、メイン画像が最初に来るように）
  // depop.comのURLのみを除外
  const validImages = images
    .filter((img) => img && typeof img === "string" && img.trim() !== "" && !img.includes("depop.com"))
    .map((img) => img.trim());
  
  // メイン画像のURLを取得（正規化）
  const mainImageUrl = (validMainImage || mainImage)?.trim() || "";
  
  // メイン画像を除いた画像リストを作成（重複を除去）
  const otherImages = validImages.filter((img) => {
    return img !== "" && img !== mainImageUrl;
  });
  
  // 重複を除去（URLの完全一致で比較）
  const uniqueOtherImages = Array.from(new Set(otherImages));
  
  // メイン画像を最初に、その後に他の画像を追加
  const allImages: string[] = [];
  if (mainImageUrl) {
    allImages.push(mainImageUrl);
  }
  uniqueOtherImages.forEach(img => {
    if (img && !allImages.includes(img)) {
      allImages.push(img);
    }
  });

  const handleImageError = (imgSrc: string) => {
    setImageErrors((prev) => new Set(prev).add(imgSrc));
  };

  return (
    <div className="space-y-4">
      {/* メイン画像 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-100">
        {imageErrors.has(selectedImage) ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-200">
            <span className="text-sm text-slate-500">画像を読み込めませんでした</span>
          </div>
        ) : (
          <Image
            src={selectedImage}
            alt={productName}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            unoptimized
            onError={() => handleImageError(selectedImage)}
          />
        )}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-white/90 px-8 py-3 text-base font-bold tracking-widest text-slate-900">
              <span className="text-red-500 font-sm">SOLD OUT</span>
            </span>
          </div>
        )}
      </div>

      {/* サムネイル画像 */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {allImages.slice(0, 4).map((img, index) => (
            <button
              key={`${img}-${index}`}
              onClick={() => setSelectedImage(img)}
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
                selectedImage === img
                  ? "border-slate-900 ring-2 ring-slate-900 ring-offset-2"
                  : "border-slate-200 bg-slate-50 hover:border-slate-400"
              }`}
              aria-label={`${productName} - 画像 ${index + 1}を表示`}
            >
              {imageErrors.has(img) ? (
                <div className="flex h-full w-full items-center justify-center bg-slate-200">
                  <span className="text-xs text-slate-400">×</span>
                </div>
              ) : (
                <Image
                  src={img}
                  alt={`${productName} - 画像 ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 25vw, 12.5vw"
                  unoptimized
                  onError={() => handleImageError(img)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

