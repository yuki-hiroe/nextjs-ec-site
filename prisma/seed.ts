import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// 接続URLの優先順位: DATABASE_URL（接続プーラー）を優先、なければDIRECT_URLを使用
// 接続プーラーの方が安定している場合が多いため
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URLまたはDIRECT_URLが設定されていません");
}

// 接続タイプをログ出力（デバッグ用）
// const connectionType = databaseUrl.includes("pooler") ? "接続プーラー" : "ダイレクト接続";
// console.log(`データベース接続: ${connectionType}`);
// console.log(`接続URL（最初の50文字）: ${databaseUrl.substring(0, 50)}...`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

async function main() {
  console.log("商品データをシードしています...");

  // 接続テスト（タイムアウトを長めに設定）
  try {
    console.log("データベースへの接続を試みています...");
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("接続タイムアウト（30秒）")), 30000)
      )
    ]);
    console.log("✓ Prisma Client接続成功");
    
    // データベース接続の詳細確認
    await prisma.$queryRaw`SELECT 1`;
    console.log("✓ データベースクエリテスト成功");
  } catch (error: any) {
    console.error("\n❌ Prisma Client接続エラー:", error.message || error);
    console.error("\n接続エラーの解決方法:");
    console.error("1. .envファイルにDATABASE_URLまたはDIRECT_URLが正しく設定されているか確認");
    console.error("2. Supabaseダッシュボードでデータベースが起動しているか確認");
    console.error("3. 接続文字列のパスワードが正しいか確認");
    console.error("4. ネットワーク接続を確認");
    console.error("\n現在の接続URL（最初の50文字）:", databaseUrl ? databaseUrl.substring(0, 50) + "..." : "未設定");
    await prisma.$disconnect();
    process.exit(1);
  }

  // 既存の商品を削除（開発用）
  try {
    await prisma.productRelation.deleteMany();
    await prisma.product.deleteMany();
  } catch (error) {
    console.error("削除エラー:", error);
    // エラーを無視して続行（テーブルが空の場合）
  }

  // 商品データを作成
  const products = [
    {
      slug: "leather-jacket",
      name: "Leather Jacket",
      price: "28,000",
      tagline: "カジュアルなコーディネートに最適なレザージャケット。",
      description:
        "カジュアルなコーディネートに最適なレザージャケット。",
      image: "https://store.mens-bigi.co.jp/photo/2021/M0543LJM201/z-M0543LJM201_8-1.jpg",
      stock: 15,
      badges: ["新着", "レザー"],
      features: [
        "大人な着こなしが可能",
        "シンプルなデザインで、様々なコーディネートに合わせやすい",
        "ベーシックな色合いで、様々なコーディネートに合わせやすい",
      ],
      specs: [
        { label: "外寸", value: "Lサイズ: 65 × 55 × 10 cm" },
        { label: "重量", value: "1.5kg" },
        { label: "素材", value: "牛革" },
      ],
      shipping: "ご注文から2〜3営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "柔らかい布で乾拭きし、定期的に専用クリームで保湿してください。",
      images: [
        "https://store.mens-bigi.co.jp/photo/2021/M0543LJM201/z-M0543LJM201_8-1.jpg",
        "https://tshop.r10s.jp/kkhakuryu/cabinet/100/12/imgrc0122207067.jpg?fitin=720%3A720",
        "https://tshop.r10s.jp/arknets/cabinet/styling/sdstyling/imgrc0110255456.jpg?fitin=720%3A720",
        "https://cdn.shop-list.com/res/up/shoplist/shp/__thum370__/silver-bullet/silver-bullet/cabinet/ca16/catn23-13-06.jpg",
      ],
      relatedSlugs: ["renaper-leather-treatment", "wood-suits-hunger"],
    },
    {
      slug: "renaper-leather-treatment",
      name: "Renaper Leather Treatment",
      price: "4,800",
      tagline: "レザーをさらに美しくするためのケア商品。",
      description:
        "レザーをさらに美しくするためのケア商品。",
      image: "https://m.media-amazon.com/images/I/71BZFBwyOZL._AC_SY695_.jpg",
      stock: 15,
      badges: ["新着", "レザー"],
      features: [
        "レザーをさらに美しくするためのケア商品。",
        "使いやすく、手軽に使用できる",
      ],
      specs: [
        { label: "容量", value: "100ml" },
        { label: "重量", value: "100g" },
        { label: "素材", value: "レザー" },
      ],
      shipping: "ご注文から2〜3営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "手洗いで使用してください。空の容器にゴミを捨てないようにご注意ください。",
      images: [
        "https://m.media-amazon.com/images/I/71QM7h8rOzL._AC_UF894,1000_QL80_.jpg",
        "https://antry.co.jp/cdn/shop/products/21MN088-00_700x700.jpg?v=1685265085",
        "https://tshop.r10s.jp/ccompanystore/cabinet/columbus/rp-0001_a700700.jpg?fitin=720%3A720",
      ],
      relatedSlugs: ["leather-jacket", "wood-suits-hunger"],
    },
    {
      slug: "wood-suits-hunger",
      name: "Wood Suits Hunger",
      price: "10,800",
      tagline: "木製のスーツハンガー。",
      description:
        "木製のスーツハンガー。",
      image: "https://m.media-amazon.com/images/I/51tgKwtTEHL.jpg",
      stock: 15,
      badges: ["新着", "木製"],
      features: [
        "木製のスーツハンガー。",
        "シンプルなデザイン",
        "コストパフォーマンスが良い",
      ],
      specs: [
        { label: "寸法", value: "120 × 120 × 180 cm" },
        { label: "重量", value: "1.5kg" },
        { label: "素材", value: "木" },
      ],
      shipping: "ご注文から2〜3営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "ぶん投げないでください。不要になったらリサイクルできます。",
      images: [
        "https://www.spacegeneral.co.nz/cdn/shop/files/Wooden-Coat-Hanger-Natural-Set-of-20-2_1080x.jpg?v=1717630650",
        "https://thumbs.dreamstime.com/b/row-men-s-suits-hanger-wooden-background-selective-focus-view-copy-space-142253518.jpg",
        "https://cdn-ak.f.st-hatena.com/images/fotolife/m/magic_0147/20240318/20240318142522.jpg",
      ],
      relatedSlugs: ["Renaper-lether-treatment", "leather-jacket"],
    },
  ];

  // 商品を作成（PostgreSQLのJson型を使用）
  const createdProducts = await Promise.all(
    products.map(async (product) => {
      const { relatedSlugs, ...productData } = product;
      return await prisma.product.upsert({
        where: { slug: productData.slug },
        update: productData,
        create: productData,
      });
    })
  );

  // 関連商品のリレーションを作成
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const createdProduct = createdProducts[i];

    if (product.relatedSlugs && product.relatedSlugs.length > 0) {
      const relatedProducts = await prisma.product.findMany({
        where: {
          slug: {
            in: product.relatedSlugs,
          },
        },
      });

      await Promise.all(
        relatedProducts.map((related) =>
          prisma.productRelation.create({
            data: {
              productId: createdProduct.id,
              relatedId: related.id,
            },
          })
        )
      );
    }
  }

  console.log(`✅ ${createdProducts.length}件の商品データをシードしました`);

  // スタイリストデータをシード
  const stylistPassword = await bcrypt.hash("stylist123", 10);
  
  const stylists = [
    {
      name: "金子 健都",
      nameEn: "Kento Kaneko",
      bio: "ミニマルで上品なオフィスカジュアル提案が得意です。",
      specialties: ["オフィスカジュアル", "モノトーン", "キレイめなコーディネート"],
      email: "kento@intercambio.com",
      password: stylistPassword,
      isActive: true,
    },
    {
      name: "佐藤 直樹",
      nameEn: "Naoki Sato",
      bio: "ストリートスタイル提案が得意です。",
      specialties: ["ストリートスタイル", "パンクスタイル"],
      email: "naoki@intercambio.com",
      password: stylistPassword,
      isActive: true,
    },
    {
      name: "前原 翔太",
      nameEn: "Shota Maehara",
      bio: "アメリカンスタイル提案が得意です。",
      specialties: ["アメリカンスタイル", "ロックスタイル"],
      email: "shota@intercambio.com",
      password: stylistPassword,
      isActive: true,
    },
    {
      name: "大坪 千晃",
      nameEn: "Kazuaki Ohtsubo",
      bio: "ハイエンドなスタイル提案が得意です。",
      specialties: ["ハイエンドなスタイル", "フォーマルスタイル", "上品"],
      email: "kazuaki@intercambio.com",
      password: stylistPassword,
      isActive: true,
    }
  ]

  const createdStylists = await Promise.all(
    stylists.map((stylist) =>
      prisma.stylist.upsert({
        where: { email: stylist.email },
        update: stylist,
        create: stylist,
      })
    )
  );

  console.log(`✅ ${createdStylists.length}件のスタイリストデータをシードしました`);
  console.log(`   スタイリストログイン情報:`);
  console.log(`   - メールアドレス: kento@intercambio.com, naoki@intercambio.com, shota@intercambio.com, kazuaki@intercambio.com`);
  console.log(`   - パスワード: stylist123`);

  console.log(`✅ ${createdStylists.length}件のスタイリストデータをシードしました`);

  // 管理者アカウントを作成（既に存在する場合はスキップ）
  const adminPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@intercambio.com" },
    update: {
      role: "admin",
    },
    create: {
      email: "admin@intercambio.com",
      password: adminPassword,
      name: "管理者",
      role: "admin",
    },
  });

  console.log(`✅ 管理者アカウントを作成しました (email: ${admin.email}, password: admin123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

