"use client";

/**
 * Cadangan sesi sisi klien.
 * Beberapa browser/webview memblokir cookie saat platform dibuka dalam iframe
 * (konteks lintas-situs). Untuk memastikan login selalu berhasil:
 * 1. Token sesi disimpan di localStorage setelah login.
 * 2. Setiap permintaan ke /api/* otomatis menyertakan header Authorization.
 * Server menerima keduanya: cookie (utama) atau header (cadangan).
 */

const TOKEN_KEY = "tll_token";

export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* localStorage tidak tersedia — cookie tetap dipakai */
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* abaikan */
  }
}

let installed = false;

/** Pasang interceptor fetch: tambahkan header Authorization untuk permintaan /api/ milik situs ini. */
export function installAuthFetch(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === "string" || input instanceof URL
          ? new URL(String(input), window.location.origin)
          : new URL((input as Request).url, window.location.origin);
      const sameOriginApi =
        url.origin === window.location.origin && url.pathname.startsWith("/api/");
      if (sameOriginApi) {
        const token = getToken();
        if (token) {
          const headers = new Headers(init?.headers || undefined);
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          init = { ...(init ?? {}), headers };
        }
      }
    } catch {
      /* URL non-standar — lanjutkan tanpa perubahan */
    }
    return originalFetch(input as RequestInfo, init);
  };
}
