"""
Cleaner: turn a messy uploaded spreadsheet into a tidy DataFrame
with a known set of columns and types.
"""

from __future__ import annotations

import re

import pandas as pd

from app.utils.column_mapper import STANDARD_COLUMNS, map_columns
from app.services.categorizer import categorize_row, infer_type


# ---------- helpers ----------

def _to_amount(value) -> float | None:
    """
    Convert messy amount strings to a float.

    Examples that should work:
        "$1,200"      -> 1200.0
        "৳500"        -> 500.0
        "500 BDT"     -> 500.0
        "(1,000)"     -> -1000.0   (accounting-style negative)
        "  -2,500.75" -> -2500.75
        ""            -> None
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        if pd.isna(value):
            return None
        return float(value)

    text = str(value).strip()
    if not text:
        return None

    # Accounting style: (123) means -123
    negative = False
    if text.startswith("(") and text.endswith(")"):
        negative = True
        text = text[1:-1]

    # Drop everything that is not a digit, dot, comma, or minus sign.
    cleaned = re.sub(r"[^0-9.,\-]", "", text)
    if not cleaned or cleaned in {"-", ".", ",", "-.", "-,"}:
        return None

    # Comma is sometimes a thousands separator and sometimes a decimal mark.
    # Heuristic: if there are both "," and "." treat "," as thousands.
    # If there is only ",", treat it as decimal mark.
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(",", "")
    elif "," in cleaned and "." not in cleaned:
        cleaned = cleaned.replace(",", ".")

    try:
        number = float(cleaned)
    except ValueError:
        return None

    if negative:
        number = -number
    return number


def _normalize_header(name: str) -> str:
    """Trim whitespace from column names and collapse internal spaces."""
    return re.sub(r"\s+", " ", str(name)).strip()


# ---------- main entry point ----------

def clean_business_data(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Clean and normalize a business-data DataFrame.

    Returns a tuple of (cleaned_df, stats) where `stats` reports a few
    data-quality metrics the frontend can show to the user.

    Steps:
      1. Drop fully empty rows and exact duplicates.
      2. Normalize column headers.
      3. Map messy column names to standard ones.
      4. Make sure all standard columns exist (missing ones get NaN).
      5. Convert the amount column into real numbers.
      6. Parse dates.
      7. Fill missing category / product / customer with sensible defaults.
      8. Infer transaction type (income / expense) when missing.

    Raises:
        ValueError if the cleaned DataFrame ends up with no usable
        amount column or no rows.
    """
    if df is None or df.empty:
        raise ValueError("The uploaded file is empty.")

    raw_rows = int(len(df))

    # 1. Drop fully empty rows and exact duplicates.
    after_empty = df.dropna(how="all")
    deduped = after_empty.drop_duplicates().reset_index(drop=True)
    duplicates_removed = int(len(after_empty) - len(deduped))
    empty_rows_removed = int(raw_rows - len(after_empty))
    df = deduped
    if df.empty:
        raise ValueError("The uploaded file has no data rows.")

    # 2. Normalize headers.
    df.columns = [_normalize_header(c) for c in df.columns]

    # 3. Map messy column names to our standard names.
    column_map = map_columns(list(df.columns))
    df = df.rename(columns=column_map)

    # If renaming produced duplicate columns (e.g. two "amount"-like
    # headers), keep the first occurrence.
    df = df.loc[:, ~df.columns.duplicated()]

    # 4. Make sure every standard column exists.
    for col in STANDARD_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA

    # 5. Amount must exist and be numeric.
    if "amount" not in df.columns:
        raise ValueError("Could not find an amount column in the uploaded file.")
    rows_before_amount = int(len(df))
    df["amount"] = df["amount"].apply(_to_amount)

    # Drop rows where amount could not be parsed.
    df = df[df["amount"].notna()].copy()
    invalid_amounts_removed = int(rows_before_amount - len(df))
    if df.empty:
        raise ValueError("No rows with a valid amount were found.")

    # 6. Parse dates (keep NaT if unparseable).
    df["date"] = pd.to_datetime(df["date"], errors="coerce", dayfirst=False)

    # Track how many rows were missing a category before we fill it in.
    category_missing_mask = df["category"].isna() | (
        df["category"].astype(str).str.strip() == ""
    )
    categories_filled = int(category_missing_mask.sum())

    # 7. Fill defaults for descriptive columns.
    df["product"] = df["product"].fillna("Unknown").astype(str).str.strip().replace("", "Unknown")
    df["customer"] = df["customer"].fillna("Unknown").astype(str).str.strip().replace("", "Unknown")
    df["description"] = df["description"].fillna("").astype(str).str.strip()

    # Quantity → numeric (missing becomes 1).
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(1)

    # 8. Category: keyword-based fill where missing.
    def _category_for(row) -> str:
        existing = row.get("category")
        if pd.notna(existing) and str(existing).strip():
            return str(existing).strip().title()
        guessed = categorize_row(row)
        return guessed or "Uncategorized"

    df["category"] = df.apply(_category_for, axis=1)

    # 9. Type: income / expense.
    def _type_for(row) -> str:
        existing = row.get("type")
        if pd.notna(existing) and str(existing).strip():
            text = str(existing).strip().lower()
            if text in {"income", "revenue", "sale", "sales", "credit", "in"}:
                return "income"
            if text in {"expense", "cost", "debit", "out", "purchase"}:
                return "expense"
        return infer_type(row)

    df["type"] = df.apply(_type_for, axis=1)

    # Reorder so the standard columns come first, then any extras.
    extras = [c for c in df.columns if c not in STANDARD_COLUMNS]
    df = df[STANDARD_COLUMNS + extras].reset_index(drop=True)

    stats = {
        "raw_rows": raw_rows,
        "cleaned_rows": int(len(df)),
        "duplicates_removed": duplicates_removed,
        "empty_rows_removed": empty_rows_removed,
        "invalid_amounts_removed": invalid_amounts_removed,
        "categories_filled": categories_filled,
    }

    return df, stats
