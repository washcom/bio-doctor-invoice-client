export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "") ?? "";

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiErrorMessage(res: Response) {
  if (res.status === 401) return "Your session expired. Please log in again.";
  if (res.status === 403) return "You do not have permission to perform this action.";

  const raw = await res.text();
  let msg = `Server error ${res.status}`;
  try {
    const parsed = JSON.parse(raw);
    msg = parsed.error || parsed.message || msg;
  } catch {
    msg = raw.slice(0, 300) || msg;
  }
  return msg;
}
