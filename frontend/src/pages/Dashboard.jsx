import { useState } from "react";
import {
  BarChart3,
  FileDown,
  FileText,
  Sparkles,
  UploadCloud,
  Wand2,
  LineChart,
  FileCheck2,
  AlertTriangle,
} from "lucide-react";

import {
  analyzeFile,
  analyzeSampleData,
  buildDownloadUrl,
  formatApiError,
} from "../api/client";
import FileUpload from "../components/FileUpload";
import SummaryCards from "../components/SummaryCards";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import CategoryChart from "../components/CategoryChart";
import TopProductsTable from "../components/TopProductsTable";
import DataPreviewTable from "../components/DataPreviewTable";
import DataQualityCard from "../components/DataQualityCard";

const HOW_IT_WORKS = [
  {
    icon: UploadCloud,
    title: "Upload",
    body: "Drop a messy CSV or Excel export from your bookkeeping or POS.",
  },
  {
    icon: Wand2,
    title: "Clean",
    body: "We normalize columns, fix amounts, and categorize transactions.",
  },
  {
    icon: LineChart,
    title: "Analyze",
    body: "See profit margin, monthly trends, and top products at a glance.",
  },
  {
    icon: FileCheck2,
    title: "Export",
    body: "Download a polished Excel workbook and a PDF summary report.",
  },
];

export default function Dashboard() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usingSample, setUsingSample] = useState(false);

  async function runAnalysis(promise, { sample = false } = {}) {
    setIsLoading(true);
    setError("");
    setUsingSample(sample);
    try {
      const data = await promise;
      setResult(data);
    } catch (err) {
      setError(formatApiError(err));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnalyze(file) {
    runAnalysis(analyzeFile(file), { sample: false });
  }

  function handleUseSampleData() {
    runAnalysis(analyzeSampleData(), { sample: true });
  }

  const hasResult = !!result;
  const excelHref = buildDownloadUrl(result?.download_excel_url);
  const pdfHref = buildDownloadUrl(result?.download_pdf_url);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-ink-200/70 bg-white/80 backdrop-blur">
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
        <Hero />

        {!hasResult && !isLoading && <HowItWorks />}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 xl:col-span-3">
            <FileUpload
              onAnalyze={handleAnalyze}
              onUseSampleData={handleUseSampleData}
              isLoading={isLoading}
              error={error}
            />

            <DownloadCard
              excelHref={excelHref}
              pdfHref={pdfHref}
              ready={hasResult && !isLoading}
            />

            {usingSample && hasResult && !isLoading && (
              <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-700">
                You're viewing results for the built-in sample dataset.
              </div>
            )}
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            {!result && !isLoading && !error && <EmptyState />}
            {!result && !isLoading && error && (
              <ErrorState message={error} onRetry={() => setError("")} />
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

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <TopProductsTable data={result.top_products} />
                  </div>
                  <div className="xl:col-span-1">
                    <DataQualityCard
                      summary={result.summary}
                      dataQuality={result.data_quality}
                    />
                  </div>
                </div>

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

function Hero() {
  return (
    <section className="rounded-3xl bg-linear-to-br from-brand-600 via-brand-500 to-brand-400 p-6 text-white shadow-sm sm:p-10">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">
          <Sparkles className="h-3.5 w-3.5" />
          For small businesses & freelancers
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Turn messy spreadsheets into a profit dashboard.
        </h1>
        <p className="mt-3 text-sm text-white/85 sm:text-base">
          Upload your sales & expense file. We'll clean it, categorize it, and
          give you summary metrics, monthly trends, and a downloadable Excel +
          PDF report — in seconds.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">How it works</h2>
          <p className="text-sm text-ink-500">
            Four steps from raw spreadsheet to downloadable report.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <step.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-ink-400">
                Step {i + 1}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink-900">
              {step.title}
            </p>
            <p className="mt-1 text-sm text-ink-500">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DownloadCard({ excelHref, pdfHref, ready }) {
  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200">
      <h3 className="text-base font-semibold text-ink-900">Reports</h3>
      <p className="mt-1 text-xs text-ink-500">
        {ready
          ? "Generated from your latest analysis."
          : "Download links unlock after you analyze a file."}
      </p>
      <div className="mt-4 grid grid-cols-1 gap-2">
        <DownloadLink
          href={excelHref}
          ready={ready}
          label="Download Cleaned Excel"
          icon={<FileDown className="h-4 w-4 text-emerald-600" />}
        />
        <DownloadLink
          href={pdfHref}
          ready={ready}
          label="Download PDF Report"
          icon={<FileText className="h-4 w-4 text-rose-600" />}
        />
      </div>
    </div>
  );
}

function DownloadLink({ href, ready, label, icon }) {
  const baseClass =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition";
  if (!ready) {
    return (
      <span
        aria-disabled="true"
        className={`${baseClass} cursor-not-allowed border-ink-200 bg-ink-50 text-ink-400`}
      >
        {icon}
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      className={`${baseClass} border-ink-200 bg-white text-ink-800 hover:bg-ink-50`}
    >
      {icon}
      {label}
    </a>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-105 flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <BarChart3 className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">
        Ready when you are
      </h3>
      <p className="mt-1 max-w-md text-sm text-ink-500">
        Drop a CSV or Excel file in the panel on the left — or click{" "}
        <span className="font-medium text-ink-700">Try sample data</span> to
        see a demo dashboard instantly.
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-70 flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 p-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-red-700">
        We couldn't analyze that file
      </h3>
      <p className="mt-1 max-w-md text-sm text-red-700/85">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50"
      >
        Dismiss & try again
      </button>
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
