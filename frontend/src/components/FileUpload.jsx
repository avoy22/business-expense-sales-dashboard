import { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, X, Loader2 } from "lucide-react";

const ACCEPTED = ".csv,.xlsx,.xls";
const ACCEPTED_EXT = ["csv", "xlsx", "xls"];

function extOf(name) {
  return (name?.split(".").pop() || "").toLowerCase();
}

export default function FileUpload({ onAnalyze, isLoading, error }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState("");

  function pickFile(f) {
    setLocalError("");
    if (!f) return;
    if (!ACCEPTED_EXT.includes(extOf(f.name))) {
      setLocalError("Unsupported file type. Please upload CSV, XLSX, or XLS.");
      return;
    }
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    if (isLoading) return;
    pickFile(e.dataTransfer.files?.[0]);
  }

  function handleSubmit() {
    if (!file || isLoading) return;
    onAnalyze(file);
  }

  function reset() {
    setFile(null);
    setLocalError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayError = localError || error;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink-900">Upload your data</h2>
        <p className="text-sm text-ink-500">
          CSV, XLSX or XLS — we'll clean it, analyze it, and build a dashboard.
        </p>
      </div>

      <label
        htmlFor="business-file"
        onDragOver={(e) => {
          e.preventDefault();
          if (!isLoading) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
          dragActive
            ? "border-brand-500 bg-brand-50"
            : "border-ink-200 bg-ink-50 hover:border-brand-400 hover:bg-brand-50",
          isLoading ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-ink-800">
          Drop a file here, or{" "}
          <span className="text-brand-600 underline-offset-2 hover:underline">
            browse
          </span>
        </p>
        <p className="mt-1 text-xs text-ink-500">CSV, XLSX, XLS up to ~25 MB</p>
        <input
          ref={inputRef}
          id="business-file"
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </label>

      {file && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3 ring-1 ring-ink-200">
          <div className="flex min-w-0 items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 shrink-0 text-brand-600" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-800">
                {file.name}
              </p>
              <p className="text-xs text-ink-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-white hover:text-ink-800 disabled:opacity-40"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {displayError && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayError}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || isLoading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-300"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          <>Analyze data</>
        )}
      </button>
    </div>
  );
}
