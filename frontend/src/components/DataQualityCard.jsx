import { CheckCircle2, ShieldCheck } from "lucide-react";

const number = new Intl.NumberFormat("en-US");

function Row({ label, value, hint }) {
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-700">{label}</p>
        {hint && <p className="truncate text-xs text-ink-400">{hint}</p>}
      </div>
      <p className="text-sm font-semibold text-ink-900">
        {typeof value === "number" ? number.format(value) : value}
      </p>
    </div>
  );
}

export default function DataQualityCard({ summary, dataQuality }) {
  const dq = dataQuality || {};
  const totalTransactions = summary?.total_transactions;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Data quality</h3>
          <p className="text-xs text-ink-500">
            Cleanup applied to your file
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
        </div>
      </div>

      <div className="divide-y divide-ink-100">
        <Row
          label="Total transactions"
          value={totalTransactions ?? dq.cleaned_rows}
        />
        <Row label="Cleaned rows" value={dq.cleaned_rows} />
        <Row
          label="Duplicate rows removed"
          value={dq.duplicates_removed}
          hint={dq.duplicates_removed === 0 ? "No duplicates found" : undefined}
        />
        <Row
          label="Empty rows removed"
          value={dq.empty_rows_removed}
        />
        <Row
          label="Invalid amounts removed"
          value={dq.invalid_amounts_removed}
        />
        <Row
          label="Missing categories filled"
          value={dq.categories_filled}
          hint={
            dq.categories_filled > 0
              ? "Filled by keyword detection"
              : undefined
          }
        />
      </div>

      {dq.export_ready && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/60">
          <CheckCircle2 className="h-4 w-4" />
          Export ready — Excel & PDF reports generated
        </div>
      )}
    </div>
  );
}
