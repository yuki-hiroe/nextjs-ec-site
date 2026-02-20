import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminStylistsClient from "@/components/AdminStylistsClient";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getStylists(status: string) {
  const where: Prisma.StylistWhereInput = {};

  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const stylists = await prisma.stylist.findMany({
    where,
    select: {
      id: true,
      name: true,
      nameEn: true,
      bio: true,
      specialties: true,
      image: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return stylists.map((stylist) => ({
    ...stylist,
    specialties: Array.isArray(stylist.specialties)
      ? stylist.specialties.filter((s): s is string => typeof s === "string")
      : typeof stylist.specialties === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(stylist.specialties);
            return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
          } catch {
            return [];
          }
        })()
      : [],
  }));
}
export default async function AdminStylistsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  const initialStylists = await getStylists('active');
  return <AdminStylistsClient initialStylists={initialStylists} />;
}