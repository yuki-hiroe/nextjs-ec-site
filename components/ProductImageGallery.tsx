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

  // メイン画像とサムネイル画像を結合（重複を除去し、メイン画像が最初に来るように）
  // images配列から重複を除去し、メイン画像と異なる画像のみを取得
  const uniqueImages = Array.from(new Set(images));
  const otherImages = uniqueImages.filter((img) => img !== mainImage);
  const allImages = [mainImage, ...otherImages];

  return (
    <div className="space-y-4">
      {/* メイン画像 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-100">
        <Image
          src={selectedImage}
          alt={productName}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>

      {/* サムネイル画像 */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {allImages.slice(0, 4).map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(img)}
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
                selectedImage === img
                  ? "border-slate-900 ring-2 ring-slate-900 ring-offset-2"
                  : "border-slate-200 bg-slate-50 hover:border-slate-400"
              }`}
              aria-label={`${productName} - 画像 ${index + 1}を表示`}
            >
              <Image
                src={img}
                alt={`${productName} - 画像 ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 25vw, 12.5vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

