import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserProfileClient from "@/components/UserProfileClient";

async function getInitialProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });
  if (!user) {
    return { user: null, orders: [] };
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, image: true, slug: true },
          },
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  return {
    user: {
      id: user.id,
      name: user.name ?? "",
      email: user.email ?? "",
      image: user.image ?? "",
    },
    orders,
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "user") {
    return redirect("/");
  }

  const initialProfile = await getInitialProfile(session.user.id);
  if (!initialProfile.user) {
    return redirect("/login");
  }
  return <UserProfileClient initialProfile={initialProfile} />;
}