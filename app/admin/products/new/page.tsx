import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminProductsNewClient from "@/components/AdminProductsNewClient";

export default async function NewProductPage() : Promise<React.ReactNode> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }
  return <AdminProductsNewClient />;
}