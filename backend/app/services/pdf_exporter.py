"""
PDF exporter: build a one-page (or short multi-page) business report
using ReportLab's high-level Platypus building blocks.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)


# ---------- helpers ----------

def _money(value: float) -> str:
    """Format a number as a currency-style string (no symbol, comma grouped)."""
    try:
        return f"{float(value):,.2f}"
    except (TypeError, ValueError):
        return "0.00"


def _styled_table(data: list[list[Any]], col_widths: list[float] | None = None) -> Table:
    """Return a ReportLab Table with a consistent business-report style."""
    table = Table(data, colWidths=col_widths, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                # Header row.
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F4E78")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 6),
                # Body.
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#B0B0B0")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


# ---------- main entry point ----------

def export_to_pdf(
    summary: dict[str, Any],
    monthly_trend: list[dict[str, Any]],
    top_products: list[dict[str, Any]],
    category_breakdown: list[dict[str, Any]],
    output_path: str | Path,
    business_name: str = "Business Report",
) -> Path:
    """
    Generate a business PDF and save it. Returns the absolute path.

    Sections in order:
      - Title + generated date
      - Headline numbers (sales, expenses, net profit, margin)
      - Monthly summary table
      - Top products table
      - Category breakdown table
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=business_name,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleCustom",
        parent=styles["Title"],
        fontSize=22,
        textColor=colors.HexColor("#1F4E78"),
        spaceAfter=6,
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.grey,
        spaceAfter=12,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#1F4E78"),
        spaceBefore=12,
        spaceAfter=6,
    )
    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontSize=10,
    )

    story: list[Any] = []

    # ----- Title block -----
    story.append(Paragraph("Business Profit & Expense Report", title_style))
    story.append(
        Paragraph(
            f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M')}",
            meta_style,
        )
    )

    # ----- Summary block -----
    story.append(Paragraph("Summary", section_style))
    summary_data = [
        ["Metric", "Value"],
        ["Total Sales", _money(summary.get("total_sales", 0))],
        ["Total Expenses", _money(summary.get("total_expenses", 0))],
        ["Net Profit", _money(summary.get("net_profit", 0))],
        ["Profit Margin", f"{summary.get('profit_margin', 0):.2f}%"],
        ["Total Transactions", str(summary.get("total_transactions", 0))],
    ]
    story.append(_styled_table(summary_data, col_widths=[70 * mm, 50 * mm]))

    # ----- Monthly summary -----
    story.append(Paragraph("Monthly Summary", section_style))
    if monthly_trend:
        monthly_data = [["Month", "Sales", "Expenses", "Profit"]]
        for row in monthly_trend:
            monthly_data.append(
                [
                    str(row.get("month", "")),
                    _money(row.get("sales", 0)),
                    _money(row.get("expenses", 0)),
                    _money(row.get("profit", 0)),
                ]
            )
        story.append(
            _styled_table(monthly_data, col_widths=[35 * mm, 40 * mm, 40 * mm, 40 * mm])
        )
    else:
        story.append(Paragraph("No date information was available.", label_style))

    # ----- Top products -----
    story.append(Spacer(1, 6))
    story.append(Paragraph("Top Products", section_style))
    if top_products:
        product_data = [["Product", "Sales"]]
        for row in top_products:
            product_data.append([str(row.get("product", "")), _money(row.get("sales", 0))])
        story.append(_styled_table(product_data, col_widths=[110 * mm, 45 * mm]))
    else:
        story.append(Paragraph("No income rows were found.", label_style))

    # ----- Category breakdown -----
    story.append(Spacer(1, 6))
    story.append(Paragraph("Category Breakdown", section_style))
    if category_breakdown:
        category_data = [["Category", "Amount"]]
        for row in category_breakdown:
            category_data.append(
                [str(row.get("category", "")), _money(row.get("amount", 0))]
            )
        story.append(_styled_table(category_data, col_widths=[110 * mm, 45 * mm]))
    else:
        story.append(Paragraph("No category data was available.", label_style))

    doc.build(story)
    return output_path.resolve()
