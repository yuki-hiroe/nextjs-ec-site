import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// 接続URLの優先順位: DATABASE_URL（接続プーラー）を優先、なければDIRECT_URLを使用
// 接続プーラーの方が安定している場合が多いため
const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URLまたはDIRECT_URLが設定されていません");
}

// 接続タイプをログ出力（デバッグ用）
const connectionType = databaseUrl.includes("pooler") ? "接続プーラー" : "ダイレクト接続";
console.log(`データベース接続: ${connectionType}`);
console.log(`接続URL（最初の50文字）: ${databaseUrl.substring(0, 50)}...`);

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
      slug: "aurora-leather-tote",
      name: "Aurora Leather Tote",
      price: "¥28,000",
      tagline: "フルグレインレザーと最小限デザインのデイリーバッグ。",
      description:
        "熟練した革職人が仕上げた Aurora シリーズの最新トート。13インチノートPCがすっきり収まり、マグネティック開閉と内ポケットで日常の持ち物をスマートに整理できます。",
      image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop&q=80",
      stock: 15,
      badges: ["新着", "レザー"],
      features: [
        "ベジタブルタンニン鞣しのフルグレインレザー",
        "撥水コーティングと耐久ステッチ",
        "13インチまでのノートPCスリーブ",
        "着脱式のミニポーチ付属",
      ],
      specs: [
        { label: "外寸", value: "38 × 28 × 12 cm" },
        { label: "重量", value: "780 g" },
        { label: "素材", value: "牛革 / コットンライニング" },
        { label: "収納", value: "ジッパーポケット ×1, オープンポケット ×2" },
      ],
      shipping: "ご注文から2〜3営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "柔らかい布で乾拭きし、定期的に専用クリームで保湿してください。",
      images: [
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: ["nimbus-knit-sneaker", "solstice-smart-watch"],
    },
    {
      slug: "nimbus-knit-sneaker",
      name: "Nimbus Knit Sneaker",
      price: "¥18,500",
      tagline: "雲のような軽さと通気性を兼ね備えた定番スニーカー。",
      description:
        "リサイクル糸を使用したニットアッパーが足を包み込み、一体型フォームソールが長時間の歩行をサポートします。ジムから街履きまで対応する万能モデルです。",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80",
      stock: 8,
      badges: ["ベストセラー"],
      features: [
        "通気性の高い3Dニットアッパー",
        "アウトソールの滑り止めパターン",
        "取り外し可能なクッションインソール",
        "35〜45までのユニセックスサイズ",
      ],
      specs: [
        { label: "重量", value: "240 g（片足 26cm）" },
        { label: "素材", value: "リサイクルポリエステル / EVA" },
        { label: "製造", value: "ベトナム" },
        { label: "サイズ感", value: "通常より0.5cm大きめ推奨" },
      ],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "汚れは中性洗剤を溶かした水で軽く叩き洗いし、陰干ししてください。",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: ["aurora-leather-tote", "nike-air-max-270"],
    },
    {
      slug: "solstice-smart-watch",
      name: "Solstice Smart Watch",
      price: "¥36,000",
      tagline: "健康管理とメッセージ通知をひとつにまとめた最新モデル。",
      description:
        "睡眠・心拍・SpO₂ まで24時間トラッキングし、仕事の通知も手元で確認。アナログとデジタルの両方の文字盤を切り替えられる、ミニマルなスマートウォッチです。",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&q=80",
      stock: 3,
      badges: ["限定"],
      features: [
        "7日間持続するロングバッテリー",
        "50m 防水とサファイアガラス",
        "Apple / Android 双方と連携",
        "NFC タッチ決済対応",
      ],
      specs: [
        { label: "ケース径", value: "42 mm" },
        { label: "重量", value: "62 g" },
        { label: "素材", value: "ステンレス / サファイアガラス" },
        { label: "防水", value: "5 ATM" },
      ],
      shipping: "ご注文から即日〜2営業日で発送。全国送料無料。",
      care: "クロスで定期的に拭き、シリコンバンドは水洗い可能です。",
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: ["aurora-leather-tote", "nimbus-knit-sneaker"],
    },
    {
      slug: "nike-air-max-270",
      name: "Nike Air Max 270",
      price: "¥20,500",
      tagline: "スマートでクールなワンランク上のスニーカー。",
      description:
        "270°のビジブル Air ユニットが特徴のライフスタイル向けモデル。柔らかいフォームと軽量アッパーで、一日中クッション性の高い履き心地を提供します。",
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop&q=80",
      stock: 12,
      badges: ["お買い得"],
      features: [
        "270° エアユニットによる高い反発性",
        "軽量メッシュアッパー",
        "かかとを包むブーティー構造",
        "シティスタイルに合うミニマルデザイン",
      ],
      specs: [
        { label: "重量", value: "255 g（片足 27cm）" },
        { label: "素材", value: "メッシュ / 合成皮革 / ラバー" },
        { label: "ソール", value: "Air Max + フォーム" },
        { label: "製造", value: "インドネシア" },
      ],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "柔らかいブラシで汚れを落とし、自然乾燥させてください。",
      images: [
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: ["nimbus-knit-sneaker"],
    },
    // ファッション商品50件
    {
      slug: "classic-white-shirt",
      name: "クラシックホワイトシャツ",
      price: "¥12,800",
      tagline: "永遠の定番、白いシャツの完璧な形。",
      description: "上質なコットン100%を使用した、洗練されたデザインのホワイトシャツ。ビジネスからカジュアルまで幅広く着回せる一枚です。",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&q=80",
      stock: 25,
      badges: ["ベストセラー", "定番"],
      features: ["コットン100%", "アイロン不要加工", "ストレッチ素材", "サイズ展開豊富"],
      specs: [{ label: "素材", value: "コットン100%" }, { label: "カラー", value: "ホワイト" }, { label: "サイズ", value: "S, M, L, XL" }],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "洗濯機で洗濯可能。低温でアイロンがけ推奨。",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
    },
    {
      slug: "denim-jacket-classic",
      name: "クラシックデニムジャケット",
      price: "¥18,900",
      tagline: "時代を超えて愛される、本格デニムジャケット。",
      description: "アメリカンカジュアルの定番、デニムジャケット。適度なウエストとレギュラーフィットで、どんなスタイルにも合わせやすい仕様です。",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop&q=80",
      stock: 18,
      badges: ["新着"],
      features: ["100%コットンデニム", "クラシックフィット", "リッパー付き", "洗濯加工済み"],
      specs: [{ label: "素材", value: "コットン100%" }, { label: "カラー", value: "インディゴブルー" }, { label: "サイズ", value: "S, M, L, XL" }],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "洗濯機で洗濯可能。裏返し洗い推奨。",
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
    },
    {
      slug: "wool-coat-trench",
      name: "ウールトレンチコート",
      price: "¥45,000",
      tagline: "上質なウールで作られた、エレガントなトレンチコート。",
      description: "イタリア産ウールを使用した、クラシックなトレンチコート。秋から春先まで長く着用できる、機能性とスタイルを兼ね備えた一着です。",
      image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop&q=80",
      stock: 12,
      badges: ["プレミアム"],
      features: ["イタリア産ウール", "防水加工", "リムーバブルライナー", "ダブルブレスト"],
      specs: [{ label: "素材", value: "ウール80%, ポリエステル20%" }, { label: "カラー", value: "ベージュ" }, { label: "サイズ", value: "S, M, L, XL" }],
      shipping: "ご注文から2〜3営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "ドライクリーニング推奨。",
      images: [
        "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
    },
    {
      slug: "chino-pants-slim",
      name: "スリムチノパンツ",
      price: "¥9,800",
      tagline: "スリムシルエットでスタイリッシュに。",
      description: "スリムフィットのチノパンツ。オフィスからカジュアルまで、幅広いシーンで活躍する定番アイテムです。",
      image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop&q=80",
      stock: 30,
      badges: ["お買い得"],
      features: ["ストレッチ素材", "スリムフィット", "ストレッチ加工", "多色展開"],
      specs: [{ label: "素材", value: "コットン98%, エラスタン2%" }, { label: "カラー", value: "ベージュ, ネイビー, ブラック" }, { label: "サイズ", value: "28-36" }],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "洗濯機で洗濯可能。",
      images: [
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
    },
    {
      slug: "leather-boots-ankle",
      name: "アンクルレザーブーツ",
      price: "¥32,000",
      tagline: "本革の質感と機能性を兼ね備えたブーツ。",
      description: "イタリア産レザーを使用した、クラシックなアンクルブーツ。履きやすさとスタイルを両立した、長く愛用できる一足です。",
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop&q=80",
      stock: 15,
      badges: ["レザー", "限定"],
      features: ["イタリア産レザー", "グッドイヤーウェルト製法", "レザーライニング", "防滑ソール"],
      specs: [{ label: "素材", value: "牛革" }, { label: "カラー", value: "ブラウン, ブラック" }, { label: "サイズ", value: "24-28cm" }],
      shipping: "ご注文から2〜3営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "レザークリームで定期的にメンテナンスしてください。",
      images: [
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
    },
    {
      slug: "cashmere-scarf",
      name: "カシミアスカーフ",
      price: "¥15,800",
      tagline: "上質なカシミアの柔らかな肌触り。",
      description: "モンゴル産カシミア100%の贅沢なスカーフ。軽くて温かく、どんなコーディネートにも上品なアクセントを加えます。",
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop&q=80",
      stock: 20,
      badges: ["プレミアム"],
      features: ["カシミア100%", "軽量", "多色展開", "ギフト対応"],
      specs: [{ label: "素材", value: "カシミア100%" }, { label: "サイズ", value: "180cm × 70cm" }, { label: "カラー", value: "グレー, ベージュ, ネイビー" }],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "ドライクリーニング推奨。",
      images: [
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
    },
    {
      slug: "knit-cardigan",
      name: "ニットカーディガン",
      price: "¥14,500",
      tagline: "季節を問わず活躍する、ベーシックなカーディガン。",
      description: "やわらかなニット素材のカーディガン。オーバーにもアウターにもなる、便利な一枚です。",
      image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop&q=80",
      stock: 22,
      badges: ["ベストセラー"],
      features: ["ウール混紡", "ボタン留め", "ポケット付き", "レギュラーフィット"],
      specs: [{ label: "素材", value: "ウール60%, アクリル40%" }, { label: "カラー", value: "グレー, ベージュ, ネイビー" }, { label: "サイズ", value: "S, M, L, XL" }],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "洗濯機で洗濯可能。平干し推奨。",
      images: [
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
    },
    {
      slug: "sneakers-canvas",
      name: "キャンバススニーカー",
      price: "¥8,900",
      tagline: "シンプルで履きやすい、定番のキャンバススニーカー。",
      description: "クラシックなデザインのキャンバススニーカー。カジュアルなスタイルに欠かせない、ベーシックな一足です。",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80",
      stock: 35,
      badges: ["お買い得"],
      features: ["キャンバス素材", "ラバーソール", "多色展開", "ユニセックス"],
      specs: [{ label: "素材", value: "キャンバス, ラバー" }, { label: "カラー", value: "ホワイト, ブラック, ネイビー" }, { label: "サイズ", value: "24-28cm" }],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "洗濯機で洗濯可能。",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
    },
    {
      slug: "leather-belt-classic",
      name: "クラシックレザーベルト",
      price: "¥6,800",
      tagline: "本革の質感が光る、シンプルなベルト。",
      description: "イタリア産レザーを使用した、クラシックなデザインのベルト。どんなスタイルにも合わせやすい、ベーシックな一本です。",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&q=80",
      stock: 28,
      badges: ["定番"],
      features: ["イタリア産レザー", "シルバーバックル", "多サイズ展開", "ギフト対応"],
      specs: [{ label: "素材", value: "牛革" }, { label: "カラー", value: "ブラウン, ブラック" }, { label: "サイズ", value: "85-110cm" }],
      shipping: "ご注文から1〜2営業日で発送。全国一律 ¥500／¥15,000以上で無料。",
      care: "レザークリームで定期的にメンテナンスしてください。",
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&q=80",
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop&q=80",
      ],
      relatedSlugs: [],
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
      name: "佐藤 美咲",
      nameEn: "Sato Misaki",
      bio: "10年以上の経験を持つパーソナルスタイリスト。ミニマルで上質なライフスタイルを提案します。",
      specialties: ["ミニマルスタイル", "ビジネスカジュアル", "カラースタイリング"],
      email: "misaki@intercambio.com",
      password: stylistPassword,
      isActive: true,
    },
    {
      name: "山田 健太",
      nameEn: "Yamada Kenta",
      bio: "テックアクセサリとファッションの融合を得意とするスタイリスト。機能性とデザイン性を両立した提案が人気です。",
      specialties: ["テックウェア", "アウトドアスタイル", "機能性重視"],
      email: "kenta@intercambio.com",
      password: stylistPassword,
      isActive: true,
    },
    {
      name: "鈴木 あかり",
      nameEn: "Suzuki Akari",
      bio: "週末の旅や日常のシーンに合わせたコーディネートを提案。軽量で持ち運びやすいアイテム選びが得意です。",
      specialties: ["トラベルスタイル", "ウィークエンドコーデ", "軽量アイテム"],
      email: "akari@intercambio.com",
      password: stylistPassword,
      isActive: true,
    },
  ];

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
  console.log(`   - メールアドレス: misaki@intercambio.com, kenta@intercambio.com, akari@intercambio.com`);
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

