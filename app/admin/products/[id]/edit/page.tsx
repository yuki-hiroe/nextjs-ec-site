import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminProductEditClient from "@/components/AdminProductEditClient";

async function  getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
  });
}

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  const { id } = await params;
  const product = await getProductById(id);
  
  if (!product) {
    notFound();
  }
  return <AdminProductEditClient initialProduct={product}  />
}