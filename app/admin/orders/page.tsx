import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import AdminOrdersClient from "@/components/AdminOrdersClient";

async function getInitialOrders(status: string, orderNumber: string, search: string) {
  const where: Prisma.OrderWhereInput = {};

  if (status && status !== "all") {
    where.status = status;
  }

  const trimmedOrderNumber = orderNumber.trim();
  if (trimmedOrderNumber) {
    where.orderNumber = { contains: trimmedOrderNumber, mode: "insensitive" };
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    where.OR = [
      { orderNumber: { contains: trimmedSearch, mode: "insensitive" } },
      { email: { contains: trimmedSearch, mode: "insensitive" } },
      { lastName: { contains: trimmedSearch, mode: "insensitive" } },
      { firstName: { contains: trimmedSearch, mode: "insensitive" } },
    ]
  }
  
  return prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }
  const initialOrders = await getInitialOrders("all", "", "");
  return <AdminOrdersClient initialOrders={initialOrders} />;
}