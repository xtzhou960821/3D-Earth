import type { Layer } from "../types";
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, options);
  const data = await response
    .json()
    .catch(() => ({ error: "本地服务返回了无效响应" }));
  if (!response.ok) throw new Error(data.error || "操作失败");
  return data;
}
export const updateLayer = (id: string, patch: Partial<Layer>) =>
  api<Layer>(`/layers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function persist(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}
