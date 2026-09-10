import type { Layer } from "../types";

/**
 * Map common network / HTTP failures to clearer Chinese diagnostics.
 * @param status HTTP status
 * @param bodyError Server `error` field when present
 */
export function describeApiFailure(
  status: number,
  bodyError?: string,
): string {
  if (bodyError) return bodyError;
  if (status === 0) return "无法连接本地服务，请确认已运行 npm start / npm run dev";
  if (status === 413) return "上传内容过大，请缩小文件或改为 3D Tiles / ion";
  if (status === 404) return "接口不存在（静态站点无上传能力，请本机 npm start）";
  if (status >= 500) return "本地服务出错，请查看终端日志后重试";
  return `操作失败（HTTP ${status}）`;
}

/**
 * JSON fetch helper against Express `/api/*`.
 * @param path API path after `/api`
 * @param options fetch init
 */
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new Error(describeApiFailure(0));
  }
  const data = await response
    .json()
    .catch(() => ({ error: "本地服务返回了无效响应" }));
  if (!response.ok)
    throw new Error(describeApiFailure(response.status, data.error));
  return data as T;
}

/**
 * Upload a layer with optional XHR progress (ImportDialog).
 * @param form Multipart form including metadata + files
 * @param onProgress 0–100 upload percentage
 */
export function uploadLayer(
  form: FormData,
  onProgress?: (percent: number) => void,
): Promise<Layer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/layers");
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      const data = xhr.response || {};
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(data as Layer);
        return;
      }
      reject(
        new Error(
          describeApiFailure(
            xhr.status,
            typeof data.error === "string" ? data.error : undefined,
          ),
        ),
      );
    };
    xhr.onerror = () => reject(new Error(describeApiFailure(0)));
    xhr.ontimeout = () =>
      reject(new Error("上传超时，请检查文件大小或网络后重试"));
    xhr.send(form);
  });
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
