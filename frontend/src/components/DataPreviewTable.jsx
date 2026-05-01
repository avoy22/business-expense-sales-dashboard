import { useMemo } from "react";

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
      value,
    );
  }
  return String(value);
}

export default function DataPreviewTable({ rows }) {
  const data = Array.isArray(rows) ? rows : [];

  const columns = useMemo(() => {
    const seen = new Set();
    const ordered = [];
    for (const row of data) {
      for (const key of Object.keys(row || {})) {
        if (!seen.has(key)) {
          seen.add(key);
          ordered.push(key);
        }
      }
    }
    return ordered;
  }, [data]);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink-900">
            Cleaned data preview
          </h3>
          <p className="text-xs text-ink-500">
            {data.length > 0
              ? `Showing first ${data.length} cleaned rows`
              : "Cleaned rows will appear here"}
          </p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 text-sm text-ink-500">
          No preview rows available
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-ink-200">
          <table className="min-w-full divide-y divide-ink-200 text-sm">
            <thead className="bg-ink-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-2.5 text-left font-medium text-ink-600 whitespace-nowrap capitalize"
                  >
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 bg-white">
              {data.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-ink-50/60">
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-2.5 text-ink-800 whitespace-nowrap"
                    >
                      {formatCell(row?.[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
