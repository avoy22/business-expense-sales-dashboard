import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US");

function Card({ icon: Icon, label, value, accent, sublabel, sublabelTone }) {
  const toneClass =
    sublabelTone === "positive"
      ? "text-emerald-600"
      : sublabelTone === "negative"
        ? "text-rose-600"
        : "text-ink-500";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-200 transition hover:shadow-md">
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
      {sublabel && (
        <p className={`mt-1 inline-flex items-center gap-1 text-xs ${toneClass}`}>
          {sublabelTone === "positive" && <ArrowUpRight className="h-3.5 w-3.5" />}
          {sublabelTone === "negative" && <ArrowDownRight className="h-3.5 w-3.5" />}
          {sublabel}
        </p>
      )}
    </div>
  );
}

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const totalSales = summary.total_sales ?? 0;
  const totalExpenses = summary.total_expenses ?? 0;
  const netProfit = summary.net_profit ?? 0;
  const margin = summary.profit_margin ?? 0;
  const profitPositive = netProfit >= 0;
  const expenseShare = totalSales > 0 ? (totalExpenses / totalSales) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card
        icon={TrendingUp}
        label="Total Sales"
        value={currency.format(totalSales)}
        accent="bg-emerald-100 text-emerald-700"
        sublabel="Gross income"
      />
      <Card
        icon={TrendingDown}
        label="Total Expenses"
        value={currency.format(totalExpenses)}
        accent="bg-rose-100 text-rose-700"
        sublabel={
          totalSales > 0 ? `${expenseShare.toFixed(1)}% of sales` : undefined
        }
      />
      <Card
        icon={Wallet}
        label="Net Profit"
        value={currency.format(netProfit)}
        accent={
          profitPositive
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
        }
        sublabel={profitPositive ? "Profit" : "Loss"}
        sublabelTone={profitPositive ? "positive" : "negative"}
      />
      <Card
        icon={Percent}
        label="Profit Margin"
        value={`${margin.toFixed(2)}%`}
        accent="bg-brand-100 text-brand-700"
        sublabel={
          margin >= 20
            ? "Healthy"
            : margin >= 10
              ? "Average"
              : margin >= 0
                ? "Tight"
                : "Negative"
        }
        sublabelTone={
          margin >= 10 ? "positive" : margin < 0 ? "negative" : "neutral"
        }
      />
      <Card
        icon={Receipt}
        label="Transactions"
        value={number.format(summary.total_transactions ?? 0)}
        accent="bg-amber-100 text-amber-700"
        sublabel="Cleaned rows"
      />
    </div>
  );
}
