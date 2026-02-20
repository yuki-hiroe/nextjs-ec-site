import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminStylistsApplicationsClient from "@/components/AdminStylistsApplicationsClient";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function getApplications() {
  const where: Prisma.StylistApplicationWhereInput = {};

  const applications = await prisma.stylistApplication.findMany({
    where,
    select: {
      id: true,
      name: true,
      nameEn: true,
      bio: true,
      specialties: true,
      image: true,
      email: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return applications.map((application) => ({
    ...application,
    specialties: Array.isArray(application.specialties)
      ? application.specialties.filter((s): s is string => typeof s === "string")
      : typeof application.specialties === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(application.specialties);
            return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
          } catch {
            return [];
          }
        })() //即時実行関数
      : [],
  }));
}

export default async function AdminStylistsApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  const initialApplications = await getApplications();
  return <AdminStylistsApplicationsClient initialApplications={initialApplications} />;
}