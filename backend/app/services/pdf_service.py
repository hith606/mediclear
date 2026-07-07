import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class PDFService:
    @staticmethod
    def generate_regulatory_report(stats: dict, reports: list, recalls: list) -> bytes:
        """
        Generates a monthly regulatory summary report as raw PDF bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            name='TitleStyle',
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=colors.HexColor("#1A365D"),
            spaceAfter=15,
            alignment=1  # Centered
        )
        
        section_style = ParagraphStyle(
            name='SectionStyle',
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=colors.HexColor("#2C5282"),
            spaceBefore=15,
            spaceAfter=10
        )
        
        body_style = ParagraphStyle(
            name='BodyStyle',
            fontName='Helvetica',
            fontSize=10,
            textColor=colors.HexColor("#2D3748"),
            spaceAfter=6
        )

        header_style = ParagraphStyle(
            name='HeaderStyle',
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=colors.white
        )

        # Title
        story.append(Paragraph("Pharmaceutical Supply Chain Integrity Report", title_style))
        story.append(Paragraph("National Regulatory and Anomaly Verification Summary", body_style))
        story.append(Spacer(1, 15))
        
        # System Statistics
        story.append(Paragraph("System Statistics Overview", section_style))
        stats_data = [
            [Paragraph("Metric", header_style), Paragraph("Count / Value", header_style)],
            [Paragraph("Total Registered Users", body_style), Paragraph(str(stats.get("total_users", 0)), body_style)],
            [Paragraph("Total Batches In System", body_style), Paragraph(str(stats.get("total_batches", 0)), body_style)],
            [Paragraph("Active Recalls", body_style), Paragraph(str(stats.get("active_recalls", 0)), body_style)],
            [Paragraph("Reported Anomaly Cases", body_style), Paragraph(str(stats.get("total_reports", 0)), body_style)],
            [Paragraph("AI Anomaly Rate", body_style), Paragraph(f"{stats.get('anomaly_rate', 0.0):.2f}%", body_style)],
        ]
        
        stats_table = Table(stats_data, colWidths=[200, 300])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2C5282")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#F7FAFC")),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 15))
        
        # Recent Counterfeit Reports
        story.append(Paragraph("Recent Counterfeit & Anomaly Incidents", section_style))
        report_data = [
            [
                Paragraph("Serial No", header_style), 
                Paragraph("Batch No", header_style), 
                Paragraph("Reporter", header_style), 
                Paragraph("Location", header_style), 
                Paragraph("Risk Score", header_style)
            ]
        ]
        
        for r in reports[:10]:  # Limit to top 10
            report_data.append([
                Paragraph(r.get("serial_number", "N/A"), body_style),
                Paragraph(r.get("batch_number", "N/A"), body_style),
                Paragraph(r.get("reporter_role", "Consumer"), body_style),
                Paragraph(r.get("location_name", "Unknown"), body_style),
                Paragraph(r.get("risk_level", "Medium"), body_style),
            ])
            
        if len(report_data) == 1:
            report_data.append([Paragraph("No security anomalies reported.", body_style), "", "", "", ""])
            
        report_table = Table(report_data, colWidths=[100, 100, 90, 130, 80])
        report_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#C53030")),  # Red header for issues
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#FFF5F5")),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#FED7D7")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(report_table)
        story.append(Spacer(1, 15))

        # Recent Recalls
        story.append(Paragraph("Active Medicine Recalls", section_style))
        recall_data = [
            [
                Paragraph("Batch Number", header_style),
                Paragraph("Medicine SKU", header_style),
                Paragraph("Manufactured", header_style),
                Paragraph("Expiry", header_style),
            ]
        ]
        for rc in recalls[:10]:
            recall_data.append([
                Paragraph(rc.get("batch_number", "N/A"), body_style),
                Paragraph(rc.get("medicine_sku", "N/A"), body_style),
                Paragraph(rc.get("manufacture_date", "").split("T")[0] if isinstance(rc.get("manufacture_date"), str) else str(rc.get("manufacture_date")), body_style),
                Paragraph(rc.get("expiry_date", "").split("T")[0] if isinstance(rc.get("expiry_date"), str) else str(rc.get("expiry_date")), body_style),
            ])
        if len(recall_data) == 1:
            recall_data.append([Paragraph("No active recalls in system.", body_style), "", "", ""])

        recall_table = Table(recall_data, colWidths=[130, 130, 120, 120])
        recall_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#DD6B20")),  # Orange header
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('BOTTOMPADDING', (0,0), (-1,0), 6),
            ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#FFFAF0")),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor("#FEEBC8")),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(recall_table)

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
