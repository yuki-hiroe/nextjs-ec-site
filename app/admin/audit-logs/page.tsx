import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminAuditLogsClient from "@/components/AdminAuditLogsClient";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function getAuditLogs() {
  const where: Prisma.AuditLogWhereInput = {};
  const orderBy: Prisma.AuditLogOrderByWithRelationInput = { createdAt: "desc" };

  const [auditLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        targetEmail: true,
        reason: true,
        details: true,
        performedBy: true,
        performedByEmail: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
      take: 100,
      skip: 0,
    }),
    prisma.auditLog.count({
      where,
    }),
  ]) ;
  return { auditLogs, total };
}

export default async function AdminAuditLogsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/admin/login");
  }
  const initialLogs = await getAuditLogs();
  const initialTotal = initialLogs.total;
  return <AdminAuditLogsClient initialLogs={initialLogs} initialTotal={initialTotal} />;
}