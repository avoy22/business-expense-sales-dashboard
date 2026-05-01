const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function TopProductsTable({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const max = rows.reduce((m, r) => Math.max(m, r.sales ?? 0), 0);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-ink-900">
          Top products & services
        </h3>
        <p className="text-xs text-ink-500">Highest revenue contributors</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 text-sm text-ink-500">
          No product data available
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {rows.map((row, idx) => {
            const pct = max ? Math.max(2, ((row.sales ?? 0) / max) * 100) : 0;
            return (
              <li
                key={`${row.product}-${idx}`}
                className="flex items-center gap-4 py-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-700">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-ink-800">
                      {row.product}
                    </p>
                    <p className="shrink-0 text-sm font-semibold text-ink-900">
                      {currency.format(row.sales ?? 0)}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
