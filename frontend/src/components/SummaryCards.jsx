import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Receipt,
} from "lucide-react";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US");

function Card({ icon: Icon, label, value, accent, sublabel }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-ink-500">{sublabel}</p>}
    </div>
  );
}

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const profitPositive = (summary.net_profit ?? 0) >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card
        icon={TrendingUp}
        label="Total Sales"
        value={currency.format(summary.total_sales ?? 0)}
        accent="bg-emerald-100 text-emerald-700"
      />
      <Card
        icon={TrendingDown}
        label="Total Expenses"
        value={currency.format(summary.total_expenses ?? 0)}
        accent="bg-rose-100 text-rose-700"
      />
      <Card
        icon={Wallet}
        label="Net Profit"
        value={currency.format(summary.net_profit ?? 0)}
        accent={
          profitPositive
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
        }
      />
      <Card
        icon={Percent}
        label="Profit Margin"
        value={`${(summary.profit_margin ?? 0).toFixed(2)}%`}
        accent="bg-brand-100 text-brand-700"
      />
      <Card
        icon={Receipt}
        label="Transactions"
        value={number.format(summary.total_transactions ?? 0)}
        accent="bg-amber-100 text-amber-700"
      />
    </div>
  );
}
