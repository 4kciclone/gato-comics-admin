// src/lib/shop-config.ts

export type CoinPackIcon = "bronze" | "silver" | "gold" | "diamond" | "legendary";

export interface CoinPack {
  label: string;
  premium: number;
  lite: number;
  price: number;
  imagePath: string;
  icon: CoinPackIcon;
  glowColor?: string;
  popular?: boolean;
  legendary?: boolean;
}

export type SubscriptionIcon = "zap" | "sparkles" | "crown" | "diamond";

export interface SubscriptionPlan {
  label: string;
  price: number;
  monthlyPaws: number;
  priceId: string;
  discount: number;
  works: number;
  icon: SubscriptionIcon;
  imagePath: string; // Novo campo
  recommended?: boolean;
  glowColor?: string; // Novo campo
}

// ---------- COIN PACKS ----------
export const COIN_PACKS: Record<string, CoinPack> = {
  pack_handful: {
    label: "Punhado",
    premium: 10,
    lite: 1,
    price: 599,
    icon: "bronze",
    imagePath: "/assets/paw-bronze.webp", 
    glowColor: "from-orange-700/20 to-orange-900/5",
  },
  pack_bag: {
    label: "Saco",
    premium: 20,
    lite: 2,
    price: 999,
    icon: "silver",
    imagePath: "/assets/paw-silver.webp",
    glowColor: "from-zinc-500/20 to-zinc-900/5",
  },
  pack_chest: {
    label: "Baú",
    premium: 30,
    lite: 5,
    price: 1499,
    icon: "gold",
    imagePath: "/assets/paw-gold.webp",
    popular: true,
    glowColor: "from-yellow-500/20 to-yellow-900/5",
  },
  pack_treas: {
    label: "Tesouro",
    premium: 50,
    lite: 12,
    price: 2499,
    icon: "diamond",
    imagePath: "/assets/paw-diamond.webp",
    glowColor: "from-cyan-500/20 to-cyan-900/5",
  },
  pack_hoard: {
    label: "Hoard",
    premium: 100,
    lite: 30,
    price: 4599,
    icon: "legendary",
    imagePath: "/assets/paw-purple.webp",
    legendary: true,
    glowColor: "from-purple-500/20 to-purple-900/5",
  },
};

// ---------- SUBSCRIPTIONS (ATUALIZADO) ----------
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  sub_bronze: {
    label: "Bronze",
    priceId: "price_bronze_id",
    price: 699,
    monthlyPaws: 10,
    discount: 5,
    works: 1,
    icon: "zap",
    imagePath: "/assets/card-bronze.webp",
    glowColor: "shadow-orange-900/20",
  },
  sub_silver: {
    label: "Prata",
    priceId: "price_silver_id",
    price: 1499,
    monthlyPaws: 15,
    discount: 8,
    works: 2,
    icon: "sparkles",
    imagePath: "/assets/card-silver.webp",
    glowColor: "shadow-zinc-500/20",
  },
  sub_gold: {
    label: "Ouro",
    priceId: "price_1Sr2CoI2ktaLUyE9ZxA4lAWk",
    price: 2599,
    monthlyPaws: 20,
    discount: 10,
    works: 3,
    icon: "crown",
    recommended: true,
    imagePath: "/assets/card-gold.webp",
    glowColor: "shadow-yellow-500/30",
  },
  sub_platinum: {
    label: "Diamante",
    priceId: "price_diamond_id",
    price: 3599,
    monthlyPaws: 30,
    discount: 15,
    works: 7,
    icon: "diamond",
    imagePath: "/assets/card-diamond.webp",
    glowColor: "shadow-cyan-500/30",
  },
};