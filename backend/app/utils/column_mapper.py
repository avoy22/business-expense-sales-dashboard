"""
Column mapper for messy business data.

Different businesses use different column names for the same kind of
information. This module turns those messy headers into a small set of
standard names the rest of the app can rely on.
"""

from __future__ import annotations

import re


# Standard column names used everywhere else in the project.
STANDARD_COLUMNS = [
    "date",
    "description",
    "product",
    "category",
    "type",
    "amount",
    "quantity",
    "customer",
]


# For each standard column, list the messy variants we want to recognize.
# Lowercased and stripped of non-alphanumerics for matching.
COLUMN_ALIASES: dict[str, list[str]] = {
    "date": [
        "date",
        "orderdate",
        "transactiondate",
        "invoicedate",
        "saledate",
        "purchasedate",
        "billdate",
    ],
    "description": [
        "description",
        "notes",
        "memo",
        "details",
        "remarks",
        "comment",
        "comments",
    ],
    "product": [
        "product",
        "productname",
        "itemname",
        "item",
        "service",
        "servicename",
    ],
    "category": [
        "category",
        "expensetype",
        "group",
    ],
    "type": [
        "type",
        "transactiontype",
        "entrytype",
        "incomeexpense",
        "kind",
    ],
    "amount": [
        "amount",
        "totalsales",
        "total",
        "revenue",
        "price",
        "cost",
        "value",
        "grandtotal",
        "subtotal",
        "sales",
    ],
    "quantity": [
        "qty",
        "quantity",
        "units",
        "count",
        "noofitems",
    ],
    "customer": [
        "customer",
        "customername",
        "client",
        "clientname",
        "buyer",
        "buyername",
    ],
}


def _normalize(name: str) -> str:
    """Lowercase the header and strip everything that is not a-z or 0-9."""
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


def map_columns(raw_columns: list[str]) -> dict[str, str]:
    """
    Return a mapping {original_column_name: standard_name}.

    A raw column is matched to the FIRST standard column whose alias
    list contains it. Each standard name is only used once: if two raw
    columns map to "amount", the first wins and the second keeps its
    normalized name so we do not silently lose data.
    """
    mapping: dict[str, str] = {}
    used_standards: set[str] = set()

    for raw in raw_columns:
        norm = _normalize(raw)
        if not norm:
            continue

        matched_standard: str | None = None
        for standard, aliases in COLUMN_ALIASES.items():
            if standard in used_standards:
                continue
            if norm in aliases:
                matched_standard = standard
                break

        if matched_standard is not None:
            mapping[raw] = matched_standard
            used_standards.add(matched_standard)
        else:
            # Unknown columns keep their normalized name.
            mapping[raw] = norm

    return mapping
