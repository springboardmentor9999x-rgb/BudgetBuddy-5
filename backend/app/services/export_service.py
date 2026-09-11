import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, String, Rect
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from typing import List, Dict, Any

def generate_csv_export(data: List[Dict[str, Any]]) -> io.BytesIO:
    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_csv(output, index=False, encoding='utf-8')
    output.seek(0)
    return output

def generate_excel_export(incomes_data: List[Dict[str, Any]], expenses_data: List[Dict[str, Any]]) -> io.BytesIO:
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        if expenses_data:
            df_exp = pd.DataFrame(expenses_data)
            df_exp.to_excel(writer, sheet_name='Expenses', index=False)
        else:
            pd.DataFrame([{"Info": "No expense data"}]).to_excel(writer, sheet_name='Expenses', index=False)
            
        if incomes_data:
            df_inc = pd.DataFrame(incomes_data)
            df_inc.to_excel(writer, sheet_name='Income', index=False)
        else:
            pd.DataFrame([{"Info": "No income data"}]).to_excel(writer, sheet_name='Income', index=False)
    output.seek(0)
    return output

def generate_pdf_report(user_name: str, period: str, summary: Dict[str, Any], expenses: List[Dict[str, Any]], include_charts: bool = True) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'SubTitleStyle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#475569'),
        spaceAfter=14
    )
    
    elements = []
    
    # Title & Subtitle
    elements.append(Paragraph("BudgetBuddy Financial Summary Report", title_style))
    elements.append(Paragraph(f"Prepared for: <b>{user_name}</b> | Period: <b>{period}</b>", subtitle_style))
    elements.append(Spacer(1, 6))
    
    # Financial Overview Box Table
    elements.append(Paragraph("<b>Financial Overview Summary</b>", styles['Heading2']))
    summary_data = [
        ["Total Income", f"${summary.get('total_income', 0):,.2f}", "Net Savings", f"${summary.get('net_savings', 0):,.2f}"],
        ["Total Expense", f"${summary.get('total_expense', 0):,.2f}", "Savings Rate", f"{summary.get('savings_rate', 0):.1f}%"]
    ]
    summary_table = Table(summary_data, colWidths=[120, 130, 120, 130])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0F172A')),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 14))

    # --- Add Visual Bar Chart (Income vs Expense) & Pie Chart (Category Breakdown) for Premium/Admin ---
    if include_charts:
        elements.append(Paragraph("<b>Financial Visual Charts (Premium Feature)</b>", styles['Heading2']))
        
        chart_drawing = Drawing(500, 150)
        
        # Bar Chart for Income vs Expense
        bc = VerticalBarChart()
        bc.x = 20
        bc.y = 20
        bc.height = 100
        bc.width = 140
        inc_val = summary.get('total_income', 0)
        exp_val = summary.get('total_expense', 0)
        bc.data = [[inc_val], [exp_val]]
        bc.categoryAxis.categoryNames = ['Cashflow']
        bc.categoryAxis.labels.boxAnchor = 'ne'
        bc.categoryAxis.labels.dx = 8
        bc.categoryAxis.labels.dy = -2
        bc.bars[0].fillColor = colors.HexColor('#10B981') # Green for Income
        bc.bars[1].fillColor = colors.HexColor('#EF4444') # Red for Expense
        chart_drawing.add(bc)
        
        # Chart Legend / Labels
        chart_drawing.add(Rect(175, 95, 10, 10, fillColor=colors.HexColor('#10B981'), strokeColor=None))
        chart_drawing.add(String(190, 96, f"Income: ${inc_val:,.0f}", fontName='Helvetica-Bold', fontSize=9, fillColor=colors.HexColor('#0F172A')))
        
        chart_drawing.add(Rect(175, 75, 10, 10, fillColor=colors.HexColor('#EF4444'), strokeColor=None))
        chart_drawing.add(String(190, 76, f"Expense: ${exp_val:,.0f}", fontName='Helvetica-Bold', fontSize=9, fillColor=colors.HexColor('#0F172A')))

        # Pie Chart for Category Spending Breakdown
        cat_totals = {}
        for e in expenses:
            cat = e.get('category', 'Other')
            amt = e.get('amount', 0)
            cat_totals[cat] = cat_totals.get(cat, 0) + amt

        if cat_totals:
            pc = Pie()
            pc.x = 310
            pc.y = 10
            pc.width = 110
            pc.height = 110
            pc.data = list(cat_totals.values())
            pc.labels = [f"{k}: ${v:,.0f}" for k, v in cat_totals.items()]
            pc.sideLabels = True
            
            pie_colors = [
                colors.HexColor('#6366F1'),
                colors.HexColor('#06B6D4'),
                colors.HexColor('#EC4899'),
                colors.HexColor('#10B981'),
                colors.HexColor('#F59E0B'),
                colors.HexColor('#8B5CF6'),
                colors.HexColor('#64748B')
            ]
            for i in range(len(cat_totals)):
                pc.slices[i].fillColor = pie_colors[i % len(pie_colors)]
            chart_drawing.add(pc)
        
        elements.append(chart_drawing)
        elements.append(Spacer(1, 14))

    # Recent Expenses Table
    elements.append(Paragraph("<b>Recent Expenses Breakdown</b>", styles['Heading2']))
    if expenses:
        table_data = [["Date", "Title", "Category", "Payment", "Amount"]]
        for e in expenses[:25]:
            table_data.append([
                str(e.get('date', ''))[:10],
                str(e.get('title', '')),
                str(e.get('category', '')),
                str(e.get('payment_method', '')),
                f"${e.get('amount', 0):,.2f}"
            ])
        exp_table = Table(table_data, colWidths=[80, 150, 100, 90, 80])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('ALIGN', (-1,0), (-1,-1), 'RIGHT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F1F5F9')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        elements.append(exp_table)
    else:
        elements.append(Paragraph("No expenses recorded for this period.", styles['Normal']))

    doc.build(elements)
    buffer.seek(0)
    return buffer
