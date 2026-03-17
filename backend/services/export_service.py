import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def export_forecast_csv(forecast_data: dict) -> bytes:
    """
    Generate CSV bytes from a single SKU forecast result.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Inventory Forecasting Report"])
    writer.writerow([f"SKU: {forecast_data.get('sku', 'N/A')}"])
    writer.writerow([f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"])
    writer.writerow([f"Horizon: {forecast_data.get('horizon_days', 30)} days"])
    writer.writerow([f"Current Stock: {forecast_data.get('current_stock', 0)}"])
    writer.writerow([f"Stockout Risk: {forecast_data.get('stockout_risk', 'N/A')}"])
    writer.writerow([f"Total Forecasted Demand: {forecast_data.get('total_forecasted_demand', 0)}"])
    writer.writerow([])
    writer.writerow(["Date", "Predicted Sales", "Lower Bound", "Upper Bound"])
    
    for item in forecast_data.get("forecast", []):
        writer.writerow([
            item["date"],
            item["predicted"],
            item["lower"],
            item["upper"]
        ])
    
    return output.getvalue().encode("utf-8")


def export_all_forecasts_csv(all_forecasts: list) -> bytes:
    """
    Generate CSV bytes for all SKU forecasts summary.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["All SKU Forecast Summary"])
    writer.writerow([f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"])
    writer.writerow([])
    writer.writerow([
        "SKU", "Horizon Days", "Current Stock",
        "Total Forecasted Demand", "Stockout Risk",
        "Days Until Stockout", "Turnover Rate"
    ])
    
    for f in all_forecasts:
        if "error" not in f:
            writer.writerow([
                f.get("sku", ""),
                f.get("horizon_days", ""),
                f.get("current_stock", ""),
                f.get("total_forecasted_demand", ""),
                f.get("stockout_risk", ""),
                f.get("days_until_stockout", "N/A"),
                f.get("turnover_rate", "")
            ])
    
    return output.getvalue().encode("utf-8")


def export_forecast_pdf(forecast_data: dict) -> bytes:
    """
    Generate a styled PDF report for a single SKU forecast.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=0.75 * inch, leftMargin=0.75 * inch,
        topMargin=0.75 * inch, bottomMargin=0.75 * inch
    )
    
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        fontSize=18, textColor=colors.HexColor("#1E3A5F"),
        spaceAfter=6, alignment=TA_CENTER
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=11, textColor=colors.grey,
        spaceAfter=4, alignment=TA_CENTER
    )
    label_style = ParagraphStyle(
        "Label", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#333333"),
        spaceAfter=2
    )
    
    story.append(Paragraph("Inventory Forecast Report", title_style))
    story.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1E3A5F")))
    story.append(Spacer(1, 0.2 * inch))
    
    # Summary Section
    risk = forecast_data.get("stockout_risk", "LOW")
    risk_colors = {"LOW": colors.green, "MEDIUM": colors.orange, "HIGH": colors.red}
    risk_color = risk_colors.get(risk, colors.grey)
    
    summary_data = [
        ["Field", "Value"],
        ["SKU", forecast_data.get("sku", "N/A")],
        ["Forecast Horizon", f"{forecast_data.get('horizon_days', 30)} days"],
        ["Current Stock", str(forecast_data.get("current_stock", 0))],
        ["Total Forecasted Demand", str(forecast_data.get("total_forecasted_demand", 0))],
        ["Stockout Risk", risk],
        ["Days Until Stockout", str(forecast_data.get("days_until_stockout", "N/A"))],
        ["Inventory Turnover Rate", str(forecast_data.get("turnover_rate", "N/A"))],
    ]
    
    summary_table = Table(summary_data, colWidths=[2.5 * inch, 3.5 * inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A5F")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    
    story.append(Paragraph("Summary", styles["Heading2"]))
    story.append(summary_table)
    story.append(Spacer(1, 0.3 * inch))
    
    # Forecast Table (first 30 rows)
    story.append(Paragraph("Daily Forecast", styles["Heading2"]))
    
    forecast_rows = [["Date", "Predicted", "Lower Bound", "Upper Bound"]]
    for item in forecast_data.get("forecast", [])[:30]:
        forecast_rows.append([
            item["date"],
            str(item["predicted"]),
            str(item["lower"]),
            str(item["upper"])
        ])
    
    fc_table = Table(forecast_rows, colWidths=[1.8*inch, 1.6*inch, 1.6*inch, 1.6*inch])
    fc_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E86AB")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
    ]))
    
    story.append(fc_table)
    story.append(Spacer(1, 0.3 * inch))
    
    # Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    story.append(Paragraph(
        "Generated by Inventory Forecasting System | IGNOU MCA Final Year Project",
        subtitle_style
    ))
    
    doc.build(story)
    return buffer.getvalue()


def export_alerts_csv(alerts: list) -> bytes:
    """Export alert data as CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Stockout Alerts Report"])
    writer.writerow([f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"])
    writer.writerow([])
    writer.writerow([
        "SKU", "Risk Level", "Current Stock",
        "Forecasted Demand (30d)", "Days Until Stockout",
        "Shortage Quantity", "Message", "Resolved", "Alert Date"
    ])
    
    for alert in alerts:
        writer.writerow([
            alert.get("sku", ""),
            alert.get("risk_level", ""),
            alert.get("current_stock", ""),
            alert.get("forecasted_demand_30d", ""),
            alert.get("days_until_stockout", ""),
            alert.get("shortage_quantity", ""),
            alert.get("message", ""),
            alert.get("resolved", False),
            alert.get("alert_date", "")
        ])
    
    return output.getvalue().encode("utf-8")
