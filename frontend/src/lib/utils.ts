import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safely parse a fetch Response as JSON, returning `fallback` on empty / unparseable bodies. */
export async function safeJson<T = unknown>(res: Response, fallback: T = {} as T): Promise<T> {
  try {
    const text = await res.text()
    return text ? JSON.parse(text) : fallback
  } catch {
    return fallback
  }
}

/**
 * API base URL for direct fetch() calls.
 * In Vite dev mode the dev-server proxy forwards /v2 → localhost:8000,
 * so we return "" (relative) to avoid cross-origin requests entirely.
 * In production builds we hit the real API.
 */
export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) return ""                       // Vite proxy handles it
  return "https://api.ROAMINGPROXY.com"
}
