"""
Categorizer: turn free-text descriptions into a small set of business
categories, and figure out whether a row is income or expense.

Pure keyword rules — no ML — so it stays predictable and easy to tweak.
"""

from __future__ import annotations

import pandas as pd


# Each category maps to keywords that strongly suggest it.
# Order matters: the first category whose keywords match wins.
CATEGORY_RULES: dict[str, list[str]] = {
    "Sales": [
        "website design",
        "logo design",
        "sale",
        "order",
        "revenue",
        "product",
        "service",
        "client payment",
        "invoice",
    ],
    "Marketing": [
        "facebook",
        "google ads",
        " ad ",
        "ads",
        "boost",
        "marketing",
        "campaign",
        "promotion",
    ],
    "Software": [
        "chatgpt",
        "claude",
        "canva",
        "domain",
        "hosting",
        "software",
        "subscription",
        "saas",
        "license",
    ],
    "Office": [
        "paper",
        "printer",
        "stationery",
        "office",
        "supplies",
    ],
    "Travel": [
        "uber",
        "taxi",
        "bus",
        "train",
        "fuel",
        "transport",
        "flight",
        "hotel",
    ],
}


# Categories that count as income (money coming in).
INCOME_CATEGORIES = {"Sales"}

# Categories that count as expense (money going out).
EXPENSE_CATEGORIES = {"Marketing", "Software", "Office", "Travel"}


def _row_text(row) -> str:
    """Combine the searchable text fields of a row into one lowercase string."""
    parts = []
    for key in ("description", "product", "category", "customer"):
        value = row.get(key) if hasattr(row, "get") else row[key] if key in row else None
        if value is not None and not (isinstance(value, float) and pd.isna(value)):
            parts.append(str(value))
    # Pad with spaces so " ad " keyword does not match inside "address".
    return " " + " ".join(parts).lower() + " "


def categorize_row(row) -> str | None:
    """Return a category name based on keywords, or None if nothing matches."""
    text = _row_text(row)
    for category, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            if keyword in text:
                return category
    return None


def infer_type(row) -> str:
    """
    Decide if a row is "income" or "expense".

    Logic:
      1. If the category is in INCOME_CATEGORIES, it's income.
      2. If the category is in EXPENSE_CATEGORIES, it's expense.
      3. If the amount is negative, it's expense. Positive defaults to income
         only when the description hints at a sale; otherwise expense, since
         most uncategorized lines in a business sheet are costs.
    """
    category = row.get("category") if hasattr(row, "get") else None
    if category in INCOME_CATEGORIES:
        return "income"
    if category in EXPENSE_CATEGORIES:
        return "expense"

    amount = row.get("amount") if hasattr(row, "get") else None
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        amount = 0.0

    if amount < 0:
        return "expense"

    # Last-ditch keyword check on description / product.
    text = _row_text(row)
    if any(k in text for k in ("sale", "invoice", "revenue", "client payment", "order")):
        return "income"

    return "expense"
