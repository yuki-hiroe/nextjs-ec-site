// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import bcrypt from "bcryptjs";

// export async function POST(request: NextRequest) {
//   try {
//     const { email, password } = await request.json();

//     if (!email || !password) {
//       return NextResponse.json(
//         { error: "メールアドレスとパスワードを入力してください" },
//         { status: 400 }
//       );
//     }

//     const stylist = await prisma.stylist.findUnique({
//       where: { email },
//     });

//     if (!stylist) {
//       return NextResponse.json(
//         { error: "メールアドレスまたはパスワードが正しくありません" },
//         { status: 401 }
//       );
//     }

//     if (!stylist.password) {
//       return NextResponse.json(
//         { error: "パスワードが設定されていません。管理者に問い合わせてください。" },
//         { status: 401 }
//       );
//     }

//     if (!stylist.isActive) {
//       return NextResponse.json(
//         { error: "このアカウントは無効化されています" },
//         { status: 403 }
//       );
//     }

//     // パスワードを検証
//     const isValidPassword = await bcrypt.compare(password, stylist.password);

//     if (!isValidPassword) {
//       return NextResponse.json(
//         { error: "メールアドレスまたはパスワードが正しくありません" },
//         { status: 401 }
//       );
//     }

//     // パスワードを除いて返す（PostgreSQLのJson型は自動的にパースされる）
//     const { password: _, ...stylistData } = stylist;

//     return NextResponse.json({ stylist: stylistData });
//   } catch (error) {
//     console.error("スタイリストログインエラー:", error);
//     return NextResponse.json(
//       { error: "ログインに失敗しました" },
//       { status: 500 }
//     );
//   }
// }

