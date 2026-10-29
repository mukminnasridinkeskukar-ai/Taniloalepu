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
  addressFull?: string;
  village?: string;
  district?: string;
  regency?: string;
  province?: string;
  latitude?: number | null;
  longitude?: number | null;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
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
  productId: string | null;
  ownerId?: string | null;
  productName: string;
  customerName: string;
  phone: string;
  address: string;
  quantity: number;
  total: number;
  status: string;
  paymentMethod?: string; // cod | transfer
  paymentStatus?: string; // menunggu | terverifikasi
  paymentProof?: string; // data URL bukti transfer
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  confirmedAt?: string | null;
  createdAt: string;
};

export const ROLE_LABEL: Record<string, string> = {
  petani: "Petani",
  operator: "Operator",
  superadmin: "Admin Desa",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: "Tunai (COD)",
  transfer: "Transfer Bank",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  menunggu: "Menunggu Verifikasi",
  terverifikasi: "Pembayaran Terverifikasi",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  baru: "Baru",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
};

export const BANK_OPTIONS = [
  "BRI",
  "BCA",
  "Mandiri",
  "BNI",
  "BSI",
  "BTN",
  "Bank Kaltimtara",
  "CIMB Niaga",
  "Danamon",
  "Permata",
  "Bank Jateng",
  "Bank Kalbar",
];

/** Gabungkan bagian alamat akun menjadi satu baris lengkap. */
export function composeAddress(u: Partial<AuthUser> | null): string {
  if (!u) return "";
  return [u.addressFull || u.address, u.village, u.district, u.regency, u.province]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

/** Nomor telepon Indonesia → tautan WhatsApp (08xx → 628xx). */
export function waLink(phone: string, text?: string): string {
  const digits = (phone || "").replace(/\D/g, "").replace(/^0/, "62");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return digits ? `https://wa.me/${digits}${q}` : "";
}

/** Tautan peta (Google Maps) dari koordinat GPS. */
export function mapsLink(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return "";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Koordinat format tampil singkat, cth: -0.40283, 117.08841 */
export function fmtCoord(v?: number | null): string {
  return v == null ? "-" : v.toFixed(5);
}

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
  ownerId?: string | null;
  // info penjual (dari akun petani, diisi server)
  sellerAddress?: string;
  sellerPhone?: string;
  sellerLat?: number | null;
  sellerLng?: number | null;
  sellerBankName?: string;
  sellerBankAccountNumber?: string;
  sellerBankAccountName?: string;
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
  buah: "Buah",
  "bumbu-dapur": "Bumbu Dapur",
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
