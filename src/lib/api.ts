import { API_BASE_URL } from "./config";
import { getIdToken } from "./cognito";

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}
