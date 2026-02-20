import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminStylistsNewClient from "@/components/AdminStylistsNewClient";

export default async function NewStylistPage() : Promise<React.ReactNode> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }

  return <AdminStylistsNewClient />;
}
