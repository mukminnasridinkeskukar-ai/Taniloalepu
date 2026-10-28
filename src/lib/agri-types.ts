// Tipe data bersama platform Tani Loa Lepu
export type Role = "petani" | "operator" | "superadmin";

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: string; // petani | operator | superadmin
  status: string;
  phone: string;
  address: string;
  avatarUrl: string;
};

export type AccountRecord = {
  id: string;
  username: string;
  password: string;
  name: string;
  role: string;
  status: string;
  phone: string;
  address: string;
  avatarUrl: string;
  createdAt: string;
  approvedAt: string | null;
  _count?: { lands: number; products: number };
};

export type OrderRecord = {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  phone: string;
  address: string;
  quantity: number;
  total: number;
  status: string;
  createdAt: string;
};

export const ROLE_LABEL: Record<string, string> = {
  petani: "Petani",
  operator: "Operator",
  superadmin: "Admin Desa",
};

export const STATUS_LABEL: Record<string, string> = {
  menunggu: "Menunggu Persetujuan",
  aktif: "Aktif",
  ditolak: "Ditolak",
};

export type Activity = {
  id: string;
  landId: string;
  title: string;
  note: string;
  date: string;
};

export type Land = {
  id: string;
  name: string;
  location: string;
  area: number;
  areaUnit: string;
  soilType: string;
  status: string;
  plannedCrop: string;
  imageUrl: string;
  notes: string;
  completedSteps: string; // JSON array
  activities?: Activity[];
  createdAt?: string;
};

export type CropDisease = { name: string; symptom: string; treatment: string };

export type Crop = {
  id: string;
  slug: string;
  name: string;
  latinName: string;
  category: string;
  difficulty: string;
  harvestDays: number;
  waterNeed: string;
  sunNeed: string;
  season: string;
  description: string;
  imageUrl: string;
  gallery: string; // JSON array
  plantingSteps: string; // JSON array
  careTips: string; // JSON array
  diseases: string; // JSON array
  priceRange: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  description: string;
  imageUrl: string;
  gallery: string; // JSON array
  farmerName: string;
  location: string;
  rating: number;
  sold: number;
  isOrganic: boolean;
};

export const LAND_STATUS: Record<string, { label: string; color: string }> = {
  persiapan: { label: "Persiapan", color: "bg-amber-100 text-amber-800 border-amber-200" },
  tanam: { label: "Ditanam", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  perawatan: { label: "Perawatan", color: "bg-lime-100 text-lime-800 border-lime-200" },
  panen: { label: "Panen", color: "bg-orange-100 text-orange-800 border-orange-200" },
  pasca: { label: "Pasca Panen", color: "bg-stone-100 text-stone-700 border-stone-200" },
};

export const SOIL_TYPES: Record<string, string> = {
  alluvial: "Alluvial (tanah sawah subur)",
  andosol: "Andosol (tanah vulkanik)",
  latosol: "Latosol (tanah merah)",
  litosol: "Litosol (tanah kapur/berbatu)",
  podsolik: "Podsolik (tanah hutan kering)",
  organosol: "Organosol (tanah gambut)",
};

export const PRODUCT_CATEGORIES: Record<string, string> = {
  semua: "Semua",
  sayuran: "Sayuran",
  buah: "Buah",
  "beras-palawija": "Beras & Palawija",
  protein: "Protein",
  olahan: "Olahan",
};

export const CROP_CATEGORIES: Record<string, string> = {
  semua: "Semua",
  "padi-padian": "Padi-padian",
  sayuran: "Sayuran",
  hortikultura: "Hortikultura",
  umbi: "Umbi",
  palawija: "Palawija",
};

export const DIFFICULTY: Record<string, { label: string; color: string }> = {
  mudah: { label: "Mudah", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  sedang: { label: "Sedang", color: "bg-amber-100 text-amber-700 border-amber-200" },
  sulit: { label: "Sulit", color: "bg-rose-100 text-rose-700 border-rose-200" },
};

export function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function parseJsonArr<T>(s: string | undefined, fallback: T[] = []): T[] {
  if (!s) return fallback;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
