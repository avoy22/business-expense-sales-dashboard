import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#3b63ee",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#22c55e",
  "#eab308",
  "#64748b",
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function CategoryChart({ data }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-ink-900">
          Category breakdown
        </h3>
        <p className="text-xs text-ink-500">Spend & revenue by category</p>
      </div>

      <div className="h-72 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(value, name) => [currency.format(value ?? 0), name]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                verticalAlign="bottom"
                height={36}
              />
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-ink-200 bg-ink-50 text-sm text-ink-500">
            No category data available
          </div>
        )}
      </div>
    </div>
  );
}
