"use client";

import { useState } from "react";
import Image from "next/image";

type ProductImageGalleryProps = {
  mainImage: string;
  images: string[];
  productName: string;
};

export default function ProductImageGallery({
  mainImage,
  images,
  productName,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(mainImage);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // メイン画像とサムネイル画像を結合（重複を除去し、メイン画像が最初に来るように）
  // images配列から重複を除去し、メイン画像と異なる画像のみを取得
  const uniqueImages = Array.from(new Set(images));
  const otherImages = uniqueImages.filter((img) => img !== mainImage && img.trim() !== "");
  const allImages = [mainImage, ...otherImages].filter((img) => img && img.trim() !== "");

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

