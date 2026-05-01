import { useState } from "react";
import { BarChart3, FileDown, FileText, Sparkles } from "lucide-react";

import { analyzeFile, buildDownloadUrl } from "../api/client";
import FileUpload from "../components/FileUpload";
import SummaryCards from "../components/SummaryCards";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import CategoryChart from "../components/CategoryChart";
import TopProductsTable from "../components/TopProductsTable";
import DataPreviewTable from "../components/DataPreviewTable";

function extractError(err) {
  if (!err) return "Something went wrong.";
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (err.code === "ECONNABORTED") return "Request timed out. Try again.";
  if (err.message?.includes("Network")) {
    return "Cannot reach the API. Is the backend running?";
  }
  return err.message || "Something went wrong.";
}

export default function Dashboard() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(file) {
    setIsLoading(true);
    setError("");
    try {
      const data = await analyzeFile(file);
      setResult(data);
    } catch (err) {
      setError(extractError(err));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  const excelHref = buildDownloadUrl(result?.download_excel_url);
  const pdfHref = buildDownloadUrl(result?.download_pdf_url);

  return (
    <div className="min-h-full">
      <header className="border-b border-ink-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">
                Profit Dashboard
              </p>
              <p className="text-xs text-ink-500">
                Clean data → instant insights
              </p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5" />
            Portfolio demo
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Business expense & sales analyzer
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Upload a messy CSV or Excel file. We'll normalize it, compute
            profit, and give you a downloadable Excel + PDF report.
          </p>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 xl:col-span-3">
            <FileUpload
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              error={error}
            />

            {result && (
              <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200">
                <h3 className="text-base font-semibold text-ink-900">
                  Reports
                </h3>
                <p className="mt-1 text-xs text-ink-500">
                  Generated from your latest upload.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <a
                    href={excelHref}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 shadow-sm transition hover:bg-ink-50"
                  >
                    <FileDown className="h-4 w-4 text-emerald-600" />
                    Download Excel
                  </a>
                  <a
                    href={pdfHref}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 shadow-sm transition hover:bg-ink-50"
                  >
                    <FileText className="h-4 w-4 text-rose-600" />
                    Download PDF
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            {!result && !isLoading && (
              <EmptyState />
            )}

            {isLoading && <LoadingState />}

            {result && !isLoading && (
              <div className="space-y-6">
                <SummaryCards summary={result.summary} />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <MonthlyTrendChart data={result.monthly_trend} />
                  </div>
                  <div className="xl:col-span-1">
                    <CategoryChart data={result.category_breakdown} />
                  </div>
                </div>

                <TopProductsTable data={result.top_products} />

                <DataPreviewTable rows={result.preview_rows} />
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 border-t border-ink-200/70 pt-6 text-center text-xs text-ink-500">
          Built with React + Vite, Tailwind CSS, Recharts, and FastAPI.
        </footer>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <BarChart3 className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">
        Ready when you are
      </h3>
      <p className="mt-1 max-w-md text-sm text-ink-500">
        Drop a CSV or Excel file in the panel on the left to see summary
        metrics, charts, and a cleaned data preview here.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-ink-200"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-ink-200 xl:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-ink-200" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-ink-200" />
    </div>
  );
}
