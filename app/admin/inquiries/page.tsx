import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import AdminInquiriesClient from "@/components/AdminInquiriesClient";

async function getInquiries(status: string, search: string) {
  const where: Prisma.InquiryWhereInput = {};

  const trimmedStatus = status.trim();
  if (trimmedStatus && trimmedStatus !== "all") {
    where.status = trimmedStatus;
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    where.OR = [
      { email: { contains: trimmedSearch, mode: "insensitive" } },
      { name: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }
  return prisma.inquiry.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      stylist: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          replies: true,
        },
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function AdminInquiriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  const initialInquiries = await getInquiries('all', '');
  return <AdminInquiriesClient initialInquiries={initialInquiries} />;
}