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
   const  { id } = await params;

   const user = await prisma.user.findUnique({
    where: { id },
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
        if (!session?.user || session.user.id !== id || session.user.role !== "user") {
            return NextResponse.json(
                { error: "認証が必要です。自分のプロフィールのみ編集できます。" },
                { status: 401 }
            );
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
        if (image !== undefined) updateData.image = image;
        if (password !== undefined && String(password).trim() !== "") {
            updateData.password = await bcrypt.hash(String(password).trim(), 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
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

