import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function tooltipFormatter(value, name) {
  const labels = { sales: "Sales", expenses: "Expenses", profit: "Profit" };
  return [currency.format(value ?? 0), labels[name] || name];
}

export default function MonthlyTrendChart({ data }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink-900">
            Monthly trend
          </h3>
          <p className="text-xs text-ink-500">
            Sales, expenses, and profit by month
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => compact.format(v)}
              />
              <Tooltip formatter={tooltipFormatter} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#3b63ee"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="No monthly data available" />
        )}
      </div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 text-sm text-ink-500">
      {label}
    </div>
  );
}
