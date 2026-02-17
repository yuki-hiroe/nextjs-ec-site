import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminUsersClient from "@/components/AdminUsersClient";

async function getInitialUsers(includeSuspended: boolean, search: string) {
  const where: {
    isSuspended?: boolean;
    OR?: Array<
      | { email: { contains: string; mode: "insensitive" } }
      | { name: { contains: string; mode: "insensitive" } } 
    >;
  } = {};

  if (!includeSuspended) {
    where.isSuspended = false;
  }
  const trimmed = search.trim();
  if (trimmed) {
    where.OR = [
      { email: { contains: trimmed, mode: "insensitive" } },
      { name: { contains: trimmed, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        firstName: true,
        phone: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedReason: true,
        createdAt: true,
        updatedAt: true,
        newsletterSubscription: {
          select: {
            id: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            orders: true,
            inquiries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // ページネーションが必要な場合は追加
  });
  return users;
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  const initialUsers = await getInitialUsers(false, '');
  return <AdminUsersClient initialUsers={initialUsers} />;
}
