import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminTestimonialsClient from "@/components/AdminTestimonialsClient";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function getTestimonials(status: string) {
  const where: Prisma.TestimonialWhereInput = {};

  if (status === 'approved') where.isApproved = true;
  if (status === 'pending') where.isApproved = false;

  return prisma.testimonial.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}


export default async function AdminTestimonialsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  // 「管理画面を開いた瞬間は全部見せる」という初期値
  const initialTestimonials = await getTestimonials('all');
  return <AdminTestimonialsClient initialTestimonials={initialTestimonials} />;
}