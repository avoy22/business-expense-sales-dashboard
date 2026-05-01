"""
Analyzer: turn a cleaned business DataFrame into the JSON-friendly
numbers and tables that the dashboard frontend wants.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


def _round(value: float, places: int = 2) -> float:
    """Round and coerce numpy types to plain Python float for JSON output."""
    if value is None or pd.isna(value):
        return 0.0
    return float(round(float(value), places))


def _income_mask(df: pd.DataFrame) -> pd.Series:
    return df["type"].astype(str).str.lower() == "income"


def _expense_mask(df: pd.DataFrame) -> pd.Series:
    return df["type"].astype(str).str.lower() == "expense"


def _abs_amount(df: pd.DataFrame) -> pd.Series:
    """Treat all amounts as positive magnitudes for income/expense math."""
    return df["amount"].astype(float).abs()


# ---------- public sections ----------

def build_summary(df: pd.DataFrame) -> dict[str, Any]:
    amounts = _abs_amount(df)
    total_sales = amounts[_income_mask(df)].sum()
    total_expenses = amounts[_expense_mask(df)].sum()
    net_profit = total_sales - total_expenses
    margin = (net_profit / total_sales * 100) if total_sales else 0.0

    return {
        "total_sales": _round(total_sales),
        "total_expenses": _round(total_expenses),
        "net_profit": _round(net_profit),
        "profit_margin": _round(margin),
        "total_transactions": int(len(df)),
    }


def build_monthly_trend(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty or df["date"].isna().all():
        return []

    work = df.copy()
    work["amount_abs"] = _abs_amount(work)
    work = work.dropna(subset=["date"])
    if work.empty:
        return []

    work["month"] = work["date"].dt.to_period("M").astype(str)

    sales = (
        work[work["type"].str.lower() == "income"]
        .groupby("month")["amount_abs"]
        .sum()
    )
    expenses = (
        work[work["type"].str.lower() == "expense"]
        .groupby("month")["amount_abs"]
        .sum()
    )

    months = sorted(set(sales.index) | set(expenses.index))
    rows: list[dict[str, Any]] = []
    for month in months:
        s = float(sales.get(month, 0.0))
        e = float(expenses.get(month, 0.0))
        rows.append(
            {
                "month": month,
                "sales": _round(s),
                "expenses": _round(e),
                "profit": _round(s - e),
            }
        )
    return rows


def build_top_products(df: pd.DataFrame, limit: int = 10) -> list[dict[str, Any]]:
    income = df[_income_mask(df)].copy()
    if income.empty:
        return []
    income["amount_abs"] = _abs_amount(income)
    grouped = (
        income.groupby("product")["amount_abs"]
        .sum()
        .sort_values(ascending=False)
        .head(limit)
    )
    return [
        {"product": str(product), "sales": _round(amount)}
        for product, amount in grouped.items()
    ]


def build_category_breakdown(df: pd.DataFrame) -> list[dict[str, Any]]:
    if df.empty:
        return []
    work = df.copy()
    work["amount_abs"] = _abs_amount(work)
    grouped = (
        work.groupby("category")["amount_abs"]
        .sum()
        .sort_values(ascending=False)
    )
    return [
        {"category": str(category), "amount": _round(amount)}
        for category, amount in grouped.items()
    ]


def build_preview_rows(df: pd.DataFrame, limit: int = 50) -> list[dict[str, Any]]:
    """First N rows of the cleaned DataFrame as JSON-friendly dicts."""
    preview = df.head(limit).copy()

    # Format dates as ISO strings (or empty when missing).
    if "date" in preview.columns:
        preview["date"] = preview["date"].apply(
            lambda x: x.strftime("%Y-%m-%d") if pd.notna(x) else ""
        )

    # Replace remaining NaN with None so JSON serialization is happy.
    preview = preview.where(pd.notna(preview), None)

    return preview.to_dict(orient="records")


# ---------- top-level helper ----------

def analyze(df: pd.DataFrame) -> dict[str, Any]:
    """Bundle every section into a single response dict."""
    return {
        "summary": build_summary(df),
        "monthly_trend": build_monthly_trend(df),
        "top_products": build_top_products(df),
        "category_breakdown": build_category_breakdown(df),
        "preview_rows": build_preview_rows(df),
    }
