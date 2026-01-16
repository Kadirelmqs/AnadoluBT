# PDF Fiş Oluşturma Servisi
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO
from datetime import datetime
from typing import Dict, List


class PDFReceiptService:
    """Sipariş fişi PDF oluşturma servisi"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Özel stil tanımlamaları"""
        self.styles.add(ParagraphStyle(
            name='CenterBold',
            parent=self.styles['Heading1'],
            alignment=TA_CENTER,
            fontSize=16,
            textColor=colors.HexColor('#1a1a1a')
        ))
        
        self.styles.add(ParagraphStyle(
            name='RightAlign',
            parent=self.styles['Normal'],
            alignment=TA_RIGHT,
            fontSize=10
        ))
    
    def generate_receipt(self, order_data: Dict) -> bytes:
        """
        Sipariş bilgilerinden PDF fiş oluşturur
        
        Args:
            order_data: Sipariş detayları içeren dictionary
            
        Returns:
            PDF dosyası byte array
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
        story = []
        
        # Başlık
        title = Paragraph("<b>DÖNER RESTORANI</b>", self.styles['CenterBold'])
        story.append(title)
        story.append(Spacer(1, 0.5*cm))
        
        subtitle = Paragraph("<b>SİPARİŞ FİŞİ</b>", self.styles['Heading2'])
        subtitle.alignment = TA_CENTER
        story.append(subtitle)
        story.append(Spacer(1, 0.5*cm))
        
        # Sipariş Bilgileri
        order_info = [
            ['Fiş No:', order_data.get('order_number', 'N/A')],
            ['Tarih:', datetime.fromisoformat(order_data.get('created_at', datetime.now().isoformat())).strftime('%d.%m.%Y %H:%M')],
            ['Masa:', order_data.get('table_name', 'Paket')],
            ['Müşteri:', order_data.get('customer_name', 'Misafir')],
        ]
        
        if order_data.get('courier_name'):
            order_info.append(['Kurye:', order_data['courier_name']])
        
        info_table = Table(order_info, colWidths=[4*cm, 12*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 0.7*cm))
        
        # Ürün Listesi
        items_data = [['Ürün', 'Adet', 'Fiyat', 'Toplam']]
        
        total = 0
        for item in order_data.get('items', []):
            quantity = item.get('quantity', 0)
            price = item.get('price', 0)
            subtotal = quantity * price
            total += subtotal
            
            items_data.append([
                item.get('product_name', 'Ürün'),
                str(quantity),
                f"{price:.2f} ₺",
                f"{subtotal:.2f} ₺"
            ])
        
        items_table = Table(items_data, colWidths=[8*cm, 2*cm, 3*cm, 3*cm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Toplam
        total_data = [
            ['Ara Toplam:', f"{total:.2f} ₺"],
            ['KDV (%10):', f"{total * 0.10:.2f} ₺"],
            ['GENEL TOPLAM:', f"{total * 1.10:.2f} ₺"],
        ]
        
        total_table = Table(total_data, colWidths=[13*cm, 3*cm])
        total_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
            ('TOPPADDING', (0, -1), (-1, -1), 10),
        ]))
        story.append(total_table)
        story.append(Spacer(1, 1*cm))
        
        # Alt bilgi
        footer = Paragraph(
            "<i>Afiyet olsun! Bizi tercih ettiğiniz için teşekkür ederiz.</i>",
            self.styles['Normal']
        )
        footer.alignment = TA_CENTER
        story.append(footer)
        
        # PDF oluştur
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
