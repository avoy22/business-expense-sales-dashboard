import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000,
});

export function buildDownloadUrl(relativePath) {
  if (!relativePath) return "";
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${API_BASE_URL}${path}`;
}

export async function analyzeFile(file) {
  const form = new FormData();
  form.append("file", file);

  const { data } = await apiClient.post("/api/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
