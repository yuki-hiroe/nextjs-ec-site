import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export type AuditAction = "delete" | "suspend" | "activate" | "update";

export type TargetType = "user" | "order" | "product" | "stylist" | "inquiry";

interface CreateAuditLogParams {
  action: AuditAction;
  targetType: TargetType;
  targetId: string;
  targetEmail?: string | null;
  reason: string;
  details?: Record<string, any>;
  performedBy: string;
  performedByEmail: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 監査ログを作成する
 * すべての管理者操作はこの関数を通じて記録される
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetEmail: params.targetEmail || null,
        reason: params.reason,
        details: params.details || undefined,
        performedBy: params.performedBy,
        performedByEmail: params.performedByEmail,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });

    return auditLog;
  } catch (error) {
    console.error("監査ログ作成エラー:", error);
    // 監査ログの作成に失敗しても、元の操作は続行する
    // ただし、本番環境ではアラートを送信することを推奨
    throw error;
  }
}

/**
 * リクエストからIPアドレスとUser Agentを取得
 */
export function getRequestInfo(request: NextRequest) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    null;
  const userAgent = request.headers.get("user-agent") || null;

  return { ipAddress, userAgent };
}

