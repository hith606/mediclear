import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf():
    # Write to local workspace
    pdf_path = "setup_guide.pdf"
    
    doc = SimpleDocTemplate(
        pdf_path, 
        pagesize=letter, 
        rightMargin=40, 
        leftMargin=40, 
        topMargin=40, 
        bottomMargin=40
    )
    
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        name='DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor("#1A365D"),
        spaceAfter=8,
        alignment=0
    )
    
    subtitle_style = ParagraphStyle(
        name='DocSub',
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#4A5568"),
        spaceAfter=20
    )
    
    h2_style = ParagraphStyle(
        name='Heading2Custom',
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor("#2B6CB0"),
        spaceBefore=12,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        name='BodyCustom',
        fontName='Helvetica',
        fontSize=9.5,
        textColor=colors.HexColor("#2D3748"),
        spaceAfter=6,
        leading=13
    )

    code_style = ParagraphStyle(
        name='CodeStyle',
        fontName='Courier',
        fontSize=8.5,
        textColor=colors.HexColor("#2D3748"),
        backColor=colors.HexColor("#EDF2F7"),
        borderColor=colors.HexColor("#E2E8F0"),
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=8,
        leading=11
    )

    header_style = ParagraphStyle(
        name='TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )

    # 1. Header Title
    story.append(Paragraph("AI-Powered Counterfeit Medicine Detection", title_style))
    story.append(Paragraph("Pharmaceutical Supply Chain Management System - Setup Guide", subtitle_style))
    story.append(Spacer(1, 10))

    # 2. System Prerequisites
    story.append(Paragraph("System Prerequisites", h2_style))
    story.append(Paragraph("Ensure the target host environment is equipped with:", body_style))
    story.append(Paragraph("• Python 3.10+", body_style))
    story.append(Paragraph("• Node.js 18+", body_style))
    story.append(Paragraph("• MongoDB instance running on localhost:27017", body_style))
    story.append(Spacer(1, 10))

    # 3. Local Installation Steps
    story.append(Paragraph("Local Setup Instructions", h2_style))
    
    story.append(Paragraph("Step 1: Backend API Configuration", body_style))
    backend_cmds = (
        "cd backend<br/>"
        "python -m venv venv<br/>"
        "venv\\Scripts\\activate (Windows) or source venv/bin/activate (Linux/Mac)<br/>"
        "pip install -r requirements.txt<br/>"
        "python app/train_models.py (Compile AI model .pkls)<br/>"
        "python seed.py (Seed Sandbox database records)<br/>"
        "uvicorn app.main:app --reload"
    )
    story.append(Paragraph(backend_cmds, code_style))
    
    story.append(Paragraph("Step 2: Frontend Client Deployment", body_style))
    frontend_cmds = (
        "cd ../frontend<br/>"
        "npm install<br/>"
        "npm run dev"
    )
    story.append(Paragraph(frontend_cmds, code_style))
    story.append(Spacer(1, 10))

    # 4. Docker Deployment
    story.append(Paragraph("Orchestration via Docker", h2_style))
    story.append(Paragraph("To assemble containers (MongoDB, FastAPI backend, Nginx serving React):", body_style))
    docker_cmds = (
        "docker-compose up --build"
    )
    story.append(Paragraph(docker_cmds, code_style))
    story.append(Spacer(1, 10))

    # 5. Seed Sandbox Accounts
    story.append(Paragraph("Pre-seeded Sandbox Accounts (Password: password123)", h2_style))
    
    table_data = [
        [Paragraph("Username", header_style), Paragraph("Role", header_style), Paragraph("Organization", header_style)],
        [Paragraph("regulator", body_style), Paragraph("Regulatory Authority", body_style), Paragraph("FDA Authority", body_style)],
        [Paragraph("manufacturer", body_style), Paragraph("Manufacturer", body_style), Paragraph("PharmaCorp Ltd", body_style)],
        [Paragraph("distributor", body_style), Paragraph("Distributor", body_style), Paragraph("LogisticsLink Inc", body_style)],
        [Paragraph("pharmacy", body_style), Paragraph("Pharmacy", body_style), Paragraph("WellnessMeds Pharmacy", body_style)],
        [Paragraph("consumer", body_style), Paragraph("Consumer", body_style), Paragraph("General Public", body_style)],
    ]
    
    cred_table = Table(table_data, colWidths=[150, 180, 200])
    cred_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B6CB0")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 5),
        ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#F7FAFC")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E0")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cred_table)

    # Build PDF
    doc.build(story)
    print("PDF generated successfully.")

if __name__ == "__main__":
    generate_pdf()
