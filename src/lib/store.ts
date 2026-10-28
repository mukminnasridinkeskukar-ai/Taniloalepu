/**
 * Lapisan data domain Tani Loa Lepu di atas klien REST (src/lib/supabase.ts).
 *
 * - Kolom basis data memakai snake_case (owner_id, image_url, ...)
 * - Aplikasi memakai camelCase (ownerId, imageUrl, ...) — sama seperti bentuk
 *   data yang selama ini dikirim ke frontend, sehingga UI tidak perlu diubah.
 */

import { rest } from "@/lib/supabase";

type Row = Record<string, unknown>;

// ===== Peta kolom camelCase ↔ snake_case per tabel =====
const USER_MAP: Record<string, string> = {
  avatarUrl: "avatar_url",
  createdAt: "created_at",
  approvedAt: "approved_at",
};
const LAND_MAP: Record<string, string> = {
  ownerId: "owner_id",
  areaUnit: "area_unit",
  soilType: "soil_type",
  plannedCrop: "planned_crop",
  imageUrl: "image_url",
  completedSteps: "completed_steps",
  createdAt: "created_at",
  updatedAt: "updated_at",
};
const ACTIVITY_MAP: Record<string, string> = {
  landId: "land_id",
};
const CROP_MAP: Record<string, string> = {
  latinName: "latin_name",
  harvestDays: "harvest_days",
  waterNeed: "water_need",
  sunNeed: "sun_need",
  imageUrl: "image_url",
  plantingSteps: "planting_steps",
  careTips: "care_tips",
  priceRange: "price_range",
};
const PRODUCT_MAP: Record<string, string> = {
  ownerId: "owner_id",
  imageUrl: "image_url",
  farmerName: "farmer_name",
  isOrganic: "is_organic",
  createdAt: "created_at",
};
const ORDER_MAP: Record<string, string> = {
  productId: "product_id",
  productName: "product_name",
  customerName: "customer_name",
  createdAt: "created_at",
};

function toRow(obj: Row, map: Record<string, string>): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) {
    out[map[k] ?? k] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
}

function fromRow<T>(row: Row, map: Record<string, string>): T {
  const rev: Record<string, string> = {};
  for (const [camel, snake] of Object.entries(map)) rev[snake] = camel;
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[rev[k] ?? k] = v;
  return out as T;
}

/** Amankan teks pencarian agar ekspresi PostgREST tidak rusak. */
function safePattern(q: string): string {
  return q.replace(/[*%(),\\"]/g, " ").trim();
}

// ===== Bentuk data (identik dengan kontrak API lama) =====
export type UserRecord = {
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
};
export type LandRecord = {
  id: string;
  ownerId: string | null;
  name: string;
  location: string;
  area: number;
  areaUnit: string;
  soilType: string;
  status: string;
  plannedCrop: string;
  imageUrl: string;
  notes: string;
  completedSteps: string;
  createdAt: string;
  updatedAt: string;
};
export type ActivityRecord = {
  id: string;
  landId: string;
  title: string;
  note: string;
  date: string;
};
export type CropRecord = {
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
  gallery: string;
  plantingSteps: string;
  careTips: string;
  diseases: string;
  priceRange: string;
};
export type ProductRecord = {
  id: string;
  ownerId: string | null;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  description: string;
  imageUrl: string;
  gallery: string;
  farmerName: string;
  location: string;
  rating: number;
  sold: number;
  isOrganic: boolean;
  createdAt: string;
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

// ===== Operasi per tabel =====
export const store = {
  users: {
    async list(filter?: { role?: string; status?: string }): Promise<UserRecord[]> {
      const filters: Record<string, string> = {};
      if (filter?.role) filters.role = `eq.${filter.role}`;
      if (filter?.status) filters.status = `eq.${filter.status}`;
      const rows = await rest.select("accounts", { filters, limit: 500 });
      return rows.map((r) => fromRow<UserRecord>(r as Row, USER_MAP));
    },
    async byId(id: string): Promise<UserRecord | null> {
      const rows = await rest.select("accounts", { filters: { id: `eq.${id}` }, limit: 1 });
      return rows[0] ? fromRow<UserRecord>(rows[0] as Row, USER_MAP) : null;
    },
    async byUsername(username: string): Promise<UserRecord | null> {
      const rows = await rest.select("accounts", {
        filters: { username: `eq.${username.toLowerCase()}` },
        limit: 1,
      });
      return rows[0] ? fromRow<UserRecord>(rows[0] as Row, USER_MAP) : null;
    },
    async create(data: Partial<UserRecord> & Pick<UserRecord, "username" | "password" | "name">): Promise<UserRecord> {
      const [row] = await rest.insert("accounts", toRow(data as Row, USER_MAP));
      return fromRow<UserRecord>(row as Row, USER_MAP);
    },
    async update(id: string, patch: Partial<UserRecord>): Promise<UserRecord | null> {
      const rows = await rest.update("accounts", { id: `eq.${id}` }, toRow(patch as Row, USER_MAP));
      return rows[0] ? fromRow<UserRecord>(rows[0] as Row, USER_MAP) : null;
    },
    async remove(id: string): Promise<void> {
      await rest.remove("accounts", { id: `eq.${id}` });
    },
  },

  lands: {
    /** Daftar lahan + aktivitas terbaru per lahan (menggantikan `include` Prisma). */
    async list(filter?: { ownerId?: string }): Promise<(LandRecord & { activities: ActivityRecord[] })[]> {
      const filters: Record<string, string> = {};
      if (filter?.ownerId) filters.owner_id = `eq.${filter.ownerId}`;
      const landRows = await rest.select("lands", { filters, order: "created_at.desc", limit: 300 });
      const lands = landRows.map((r) => fromRow<LandRecord>(r as Row, LAND_MAP));
      if (lands.length === 0) return [];

      const ids = lands.map((l) => l.id);
      const inList = `(${ids.join(",")})`;
      const actRows = await rest.select("activities", {
        filters: { land_id: `in.${inList}` },
        order: "date.desc",
        limit: 600,
      });
      const grouped: Record<string, ActivityRecord[]> = {};
      for (const raw of actRows) {
        const act = fromRow<ActivityRecord>(raw as Row, ACTIVITY_MAP);
        (grouped[act.landId] ??= []).push(act);
      }
      return lands.map((l) => ({ ...l, activities: (grouped[l.id] ?? []).slice(0, 20) }));
    },
    async byId(id: string): Promise<LandRecord | null> {
      const rows = await rest.select("lands", { filters: { id: `eq.${id}` }, limit: 1 });
      return rows[0] ? fromRow<LandRecord>(rows[0] as Row, LAND_MAP) : null;
    },
    async create(data: Partial<LandRecord>): Promise<LandRecord> {
      const [row] = await rest.insert("lands", toRow(data as Row, LAND_MAP));
      return fromRow<LandRecord>(row as Row, LAND_MAP);
    },
    async update(id: string, patch: Partial<LandRecord>): Promise<LandRecord | null> {
      const rows = await rest.update("lands", { id: `eq.${id}` }, toRow(patch as Row, LAND_MAP));
      return rows[0] ? fromRow<LandRecord>(rows[0] as Row, LAND_MAP) : null;
    },
    async remove(id: string): Promise<void> {
      await rest.remove("lands", { id: `eq.${id}` });
    },
  },

  activities: {
    async listByLand(landId: string, limit = 50): Promise<ActivityRecord[]> {
      const rows = await rest.select("activities", {
        filters: { land_id: `eq.${landId}` },
        order: "date.desc",
        limit,
      });
      return rows.map((r) => fromRow<ActivityRecord>(r as Row, ACTIVITY_MAP));
    },
    async create(data: { landId: string; title: string; note?: string }): Promise<ActivityRecord> {
      const [row] = await rest.insert("activities", toRow(data as Row, ACTIVITY_MAP));
      return fromRow<ActivityRecord>(row as Row, ACTIVITY_MAP);
    },
  },

  crops: {
    async list(filter?: { q?: string; category?: string }): Promise<CropRecord[]> {
      const filters: Record<string, string> = {};
      if (filter?.category && filter.category !== "semua") filters.category = `eq.${filter.category}`;
      const q = safePattern(filter?.q ?? "");
      const rows = await rest.select("crops", {
        filters,
        or: q ? `(name.ilike.*${q}*,latin_name.ilike.*${q}*,description.ilike.*${q}*)` : undefined,
        order: "name.asc",
        limit: 300,
      });
      return rows.map((r) => fromRow<CropRecord>(r as Row, CROP_MAP));
    },
  },

  products: {
    async list(filter?: { q?: string; category?: string; sort?: string; ownerId?: string; ids?: string[] }): Promise<ProductRecord[]> {
      const filters: Record<string, string> = {};
      if (filter?.category && filter.category !== "semua") filters.category = `eq.${filter.category}`;
      if (filter?.ownerId) filters.owner_id = `eq.${filter.ownerId}`;
      if (filter?.ids) {
        if (filter.ids.length === 0) return [];
        filters.id = `in.(${filter.ids.join(",")})`;
      }
      const orderMap: Record<string, string> = {
        populer: "sold.desc",
        termurah: "price.asc",
        termahal: "price.desc",
        terbaru: "created_at.desc",
        rating: "rating.desc",
      };
      const q = safePattern(filter?.q ?? "");
      const rows = await rest.select("products", {
        filters,
        or: q
          ? `(name.ilike.*${q}*,description.ilike.*${q}*,farmer_name.ilike.*${q}*,location.ilike.*${q}*)`
          : undefined,
        order: orderMap[filter?.sort ?? "populer"] ?? "sold.desc",
        limit: 300,
      });
      return rows.map((r) => fromRow<ProductRecord>(r as Row, PRODUCT_MAP));
    },
    async byId(id: string): Promise<ProductRecord | null> {
      const rows = await rest.select("products", { filters: { id: `eq.${id}` }, limit: 1 });
      return rows[0] ? fromRow<ProductRecord>(rows[0] as Row, PRODUCT_MAP) : null;
    },
    async create(data: Partial<ProductRecord>): Promise<ProductRecord> {
      const [row] = await rest.insert("products", toRow(data as Row, PRODUCT_MAP));
      return fromRow<ProductRecord>(row as Row, PRODUCT_MAP);
    },
    /** Ubah stok/terjual dengan penjaga konkurensi sederhana (stok lama harus cocok). */
    async adjustStock(id: string, oldStock: number, patch: { stock: number; sold: number }): Promise<boolean> {
      const rows = await rest.update(
        "products",
        { id: `eq.${id}`, stock: `eq.${oldStock}` },
        patch
      );
      return rows.length > 0;
    },
  },

  orders: {
    async list(filter?: { productIds?: string[] }): Promise<OrderRecord[]> {
      const filters: Record<string, string> = {};
      if (filter?.productIds) {
        if (filter.productIds.length === 0) return [];
        filters.product_id = `in.(${filter.productIds.join(",")})`;
      }
      const rows = await rest.select("orders", {
        filters,
        order: "created_at.desc",
        limit: 100,
      });
      return rows.map((r) => fromRow<OrderRecord>(r as Row, ORDER_MAP));
    },
    async create(data: {
      productId: string;
      productName: string;
      customerName: string;
      phone: string;
      address: string;
      quantity: number;
      total: number;
    }): Promise<OrderRecord> {
      const [row] = await rest.insert("orders", toRow(data as Row, ORDER_MAP));
      return fromRow<OrderRecord>(row as Row, ORDER_MAP);
    },
  },
};
