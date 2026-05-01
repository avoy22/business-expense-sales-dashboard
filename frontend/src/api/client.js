import axios from "axios";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

if (!API_BASE_URL && import.meta.env.DEV) {
  console.warn(
    "[api] VITE_API_BASE_URL is not set. Falling back to same-origin requests. " +
      "Add VITE_API_BASE_URL=http://127.0.0.1:8000 to frontend/.env.local for local dev.",
  );
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000,
});

export function getApiBaseUrl() {
  return API_BASE_URL;
}

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

const SAMPLE_CSV = `Order Date,Item Name,Total Sales,Expense Type,Customer Name,Qty,Notes
2026-01-02,Website Design,"$500",,Rahim,1,Client payment
2026-01-05,Facebook Ads,"$50",Marketing,,1,Ad spend
2026-01-10,Logo Design,"$120",,Karim,1,Client payment
2026-02-01,ChatGPT Subscription,"$20",Software,,1,Monthly tool
2026-02-04,Website Design,"$700",,Nadia,1,Client payment
2026-02-08,Domain Hosting,"$35",Software,,1,Hosting cost
`;

export function buildSampleCsvFile() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
  return new File([blob], "sample-business-data.csv", {
    type: "text/csv",
  });
}

export async function analyzeSampleData() {
  return analyzeFile(buildSampleCsvFile());
}

/**
 * Turn an axios error into a short, user-facing message.
 */
export function formatApiError(err) {
  if (!err) return "Something went wrong. Please try again.";

  // Axios timeout
  if (err.code === "ECONNABORTED") {
    return "The request timed out. Try a smaller file or check your connection.";
  }

  // No HTTP response at all → backend down or CORS
  if (!err.response) {
    if (
      err.code === "ERR_NETWORK" ||
      /Network Error/i.test(err.message || "")
    ) {
      const target = API_BASE_URL || "the backend";
      return `Cannot reach ${target}. Make sure the backend is running and CORS allows this origin.`;
    }
    return err.message || "Network error. Please try again.";
  }

  const { status, data } = err.response;
  const detail = data?.detail;

  if (status === 400) {
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg)
      return `Validation error: ${detail[0].msg}`;
    return "The uploaded file looks invalid. Please check the format and try again.";
  }
  if (status === 413) {
    return "That file is too large. Try a smaller export.";
  }
  if (status === 415 || status === 422) {
    return typeof detail === "string"
      ? detail
      : "Unsupported file. Please upload CSV, XLSX, or XLS.";
  }
  if (status >= 500) {
    return typeof detail === "string"
      ? `Server error: ${detail}`
      : "The server hit an error processing this file. Please try again.";
  }

  return typeof detail === "string"
    ? detail
    : err.message || "Something went wrong.";
}
