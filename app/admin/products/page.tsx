import { getServerSession } from "next-auth";
import { prisma } from '@/lib/prisma';
import AdminProductsClient from '@/components/AdminProductsClient';
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// 初期商品データを取得
async function getInitialProducts(search: string) {
  const where: Prisma.ProductWhereInput = {};
  
  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    where.name = { contains: trimmedSearch, mode: "insensitive" };
  }

  return await prisma.product.findMany({
    where,
    select: {
      id: true,
      slug: true,
      name: true,
      price: true,
      stock: true,
      image: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

// 管理者ページの商品ページ
export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }
  const initialProducts = await getInitialProducts("");
  return <AdminProductsClient initialProducts={initialProducts} />;
}