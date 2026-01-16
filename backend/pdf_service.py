# PDF Fiş Oluşturma Servisi (2 Tip: Paket & İçeride/Gel-Al)
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO
from datetime import datetime
from typing import Dict, List
import os

# Türkçe karakter desteği için font kaydet
try:
    # DejaVu Sans font (Türkçe karakterleri destekler)
    font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    if os.path.exists(font_path):
        pdfmetrics.registerFont(TTFont('DejaVu', font_path))
        pdfmetrics.registerFont(TTFont('DejaVu-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
        FONT_NAME = 'DejaVu'
        FONT_BOLD = 'DejaVu-Bold'
    else:
        FONT_NAME = 'Helvetica'
        FONT_BOLD = 'Helvetica-Bold'
except:
    FONT_NAME = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'


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
            fontName=FONT_BOLD,
            textColor=colors.HexColor('#1a1a1a')
        ))
        
        self.styles.add(ParagraphStyle(
            name='RightAlign',
            parent=self.styles['Normal'],
            alignment=TA_RIGHT,
            fontSize=10,
            fontName=FONT_NAME
        ))
    
    def generate_receipt(self, order_data: Dict) -> bytes:
        """
        Sipariş tipine göre uygun fişi oluşturur
        - Paket: Müşteri adresi + telefon
        - İçeride/Gel-Al: Standart fiş
        """
        order_type = order_data.get('order_type', 'dine-in')
        
        if order_type == 'takeaway':
            return self._generate_package_receipt(order_data)
        else:
            return self._generate_standard_receipt(order_data)
    
    def _generate_package_receipt(self, order_data: Dict) -> bytes:
        """PAKET siparişi için fiş (Müşteri bilgileri ile)"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
        story = []
        
        # Başlık
        title = Paragraph("<b>ANADOLU BT - PAKET SİPARİŞİ</b>", self.styles['CenterBold'])
        story.append(title)
        story.append(Spacer(1, 0.5*cm))
        
        # Sipariş Bilgileri
        order_info = [
            ['Fiş No:', order_data.get('order_number', 'N/A')],
            ['Tarih:', datetime.fromisoformat(order_data.get('created_at', datetime.now().isoformat())).strftime('%d.%m.%Y %H:%M')],
            ['Sipariş Tipi:', 'PAKET SİPARİŞİ'],
        ]
        
        # Müşteri Bilgileri (PAKET için özel)
        order_info.append(['', ''])  # Boş satır
        order_info.append(['MÜŞTERİ BİLGİLERİ', ''])
        order_info.append(['Müşteri Adı:', order_data.get('customer_name', 'Belirtilmemiş')])
        order_info.append(['Telefon:', order_data.get('customer_phone', 'Belirtilmemiş')])
        order_info.append(['Adres:', order_data.get('customer_address', 'Belirtilmemiş')])
        
        if order_data.get('courier_name'):
            order_info.append(['', ''])
            order_info.append(['Kurye:', order_data['courier_name']])
        
        info_table = Table(order_info, colWidths=[4*cm, 12*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), FONT_BOLD),
            ('FONTNAME', (0, 4), (-1, 4), FONT_BOLD),  # "MÜŞTERİ BİLGİLERİ" başlığı
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('SPAN', (0, 4), (1, 4)),  # Başlığı birleştir
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
                f"{price:.2f} TL",
                f"{subtotal:.2f} TL"
            ])
        
        items_table = Table(items_data, colWidths=[8*cm, 2*cm, 3*cm, 3*cm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF6600')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), FONT_NAME),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Toplam
        total_data = [
            ['Ara Toplam:', f"{total:.2f} TL"],
            ['KDV (%10):', f"{total * 0.10:.2f} TL"],
            ['GENEL TOPLAM:', f"{total * 1.10:.2f} TL"],
        ]
        
        total_table = Table(total_data, colWidths=[13*cm, 3*cm])
        total_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), FONT_BOLD),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('FONTNAME', (0, 0), (-1, -2), FONT_NAME),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
            ('TOPPADDING', (0, -1), (-1, -1), 10),
        ]))
        story.append(total_table)
        story.append(Spacer(1, 1*cm))
        
        # Alt bilgi
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            alignment=TA_CENTER,
            fontSize=9,
            fontName=FONT_NAME
        )
        footer = Paragraph("<i>Afiyet olsun! Bizi tercih ettiğiniz için teşekkür ederiz.</i><br/><b>Powered by Anadolu BT</b>", footer_style)
        story.append(footer)
        
        # PDF oluştur
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def _generate_standard_receipt(self, order_data: Dict) -> bytes:
        """İÇERİDE ve GEL-AL siparişleri için standart fiş"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
        story = []
        
        # Başlık
        title = Paragraph("<b>ANADOLU BT - SİPARİŞ FİŞİ</b>", self.styles['CenterBold'])
        story.append(title)
        story.append(Spacer(1, 0.5*cm))
        
        # Sipariş Bilgileri
        order_type_map = {
            'dine-in': 'İÇERİDE',
            'delivery': 'GEL-AL'
        }
        
        order_info = [
            ['Fiş No:', order_data.get('order_number', 'N/A')],
            ['Tarih:', datetime.fromisoformat(order_data.get('created_at', datetime.now().isoformat())).strftime('%d.%m.%Y %H:%M')],
            ['Sipariş Tipi:', order_type_map.get(order_data.get('order_type'), 'N/A')],
        ]
        
        if order_data.get('table_name'):
            order_info.append(['Masa:', order_data['table_name']])
        
        info_table = Table(order_info, colWidths=[4*cm, 12*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), FONT_NAME),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTNAME', (0, 0), (0, -1), FONT_BOLD),
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
                f"{price:.2f} TL",
                f"{subtotal:.2f} TL"
            ])
        
        items_table = Table(items_data, colWidths=[8*cm, 2*cm, 3*cm, 3*cm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0066CC')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('FONTNAME', (0, 1), (-1, -1), FONT_NAME),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 0.5*cm))
        
        # Toplam
        total_data = [
            ['Ara Toplam:', f"{total:.2f} TL"],
            ['KDV (%10):', f"{total * 0.10:.2f} TL"],
            ['GENEL TOPLAM:', f"{total * 1.10:.2f} TL"],
        ]
        
        total_table = Table(total_data, colWidths=[13*cm, 3*cm])
        total_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), FONT_BOLD),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('FONTNAME', (0, 0), (-1, -2), FONT_NAME),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
            ('TOPPADDING', (0, -1), (-1, -1), 10),
        ]))
        story.append(total_table)
        story.append(Spacer(1, 1*cm))
        
        # Alt bilgi
        footer_style = ParagraphStyle(
            'Footer',
            parent=self.styles['Normal'],
            alignment=TA_CENTER,
            fontSize=9,
            fontName=FONT_NAME
        )
        footer = Paragraph("<i>Afiyet olsun! Bizi tercih ettiğiniz için teşekkür ederiz.</i><br/><b>Powered by Anadolu BT</b>", footer_style)
        story.append(footer)
        
        # PDF oluştur
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
