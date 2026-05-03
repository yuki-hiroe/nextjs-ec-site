import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) { 
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

   const user = await prisma.user.findUnique({
    where: { id },
    select: {
        id: true,
        name: true,
        lastName: true,
        firstName: true,
        email: true,
        emailVerified: true,
        phone: true,
        isSuspended: true,
        suspendedAt: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
    }
   });

   if (!user) {
    return NextResponse.json(
      { error: "ユーザーが見つかりません" },
      { status: 404 }
    );
   }
   return NextResponse.json(user);
  } catch(error) {
    console.error("ユーザー取得エラー:", error);
    return NextResponse.json(
      { error: "ユーザーの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(
    request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    try{
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
        }
        if (session.user.id !== id || session.user.role !== "user") {
            return NextResponse.json({ error: "権限がありません" }, { status: 403 });
        }
        const body = await request.json();
        const { name, email, image, password } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) {
            const trimmedEmail = (email || "").trim();
            if (!trimmedEmail) {
                return NextResponse.json(
                    { error: "メールアドレスを入力してください" },
                    { status: 400 }
                );
            }
            updateData.email = trimmedEmail;
        }

        //重複チェック : 同じ email を持つ別ユーザーがいないか確認
        if (updateData.email) {
            const existing = await prisma.user.findUnique({
                where: { email: updateData.email },
                select: { id: true },
            });
            if (existing && existing.id !== id) {
                return NextResponse.json(
                    { error: "このメールアドレスは既に使用されています" },
                    { status: 400 }
                );
            }
        }
        if (image !== undefined) updateData.image = image;
        if (password !== undefined && String(password).trim() !== "") {
            updateData.password = await bcrypt.hash(String(password).trim(), 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                emailVerified: true,
                lastName: true,
                firstName: true,
                phone: true,
                role: true,
                image: true,
                isSuspended: true,
                suspendedAt: true,
                suspendedReason: true,
                createdAt: true,
                updatedAt: true,
            },
            data: updateData,
        });
        
        return NextResponse.json(updatedUser);
    } catch(error) {
        console.error("ユーザー更新エラー:", error);
        return NextResponse.json(
            { error: "ユーザーの更新に失敗しました" },
            { status: 500 }
        );
    }
}

