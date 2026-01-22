from fastapi import FastAPI, APIRouter, HTTPException, Response, Depends
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pdf_service import PDFReceiptService
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin, require_courier
)
from excel_service import ExcelExportService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Services
pdf_service = PDFReceiptService()
excel_service = ExcelExportService()

# Create the main app
app = FastAPI(title="Döner Restoranı POS API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    role: str  # "admin" or "courier"
    is_approved: bool = False
    courier_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    username: str
    password: str
    # Kurye bilgileri
    first_name: str
    last_name: str
    phone_number: str
    vehicle_type: str
    vehicle_plate: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    category_id: str
    image_url: Optional[str] = None
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category_id: str
    image_url: Optional[str] = None

class Table(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: str
    capacity: int
    is_occupied: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TableCreate(BaseModel):
    table_number: str
    capacity: int

class Courier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    phone_number: str
    vehicle_type: str
    vehicle_plate: Optional[str] = None
    is_available: bool = True
    current_location: Optional[str] = None
    user_id: Optional[str] = None
    is_approved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CourierCreate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    vehicle_type: str
    vehicle_plate: Optional[str] = None

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    items: List[OrderItem]
    total_amount: float
    status: str = "pending"
    order_type: str = "dine-in"
    table_id: Optional[str] = None
    table_name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    courier_id: Optional[str] = None
    courier_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    order_type: str = "dine-in"
    table_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    notes: Optional[str] = None

class AssignCourier(BaseModel):
    courier_id: str


# ==================== HELPER FUNCTIONS ====================

async def get_next_order_number() -> str:
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    count = await db.orders.count_documents({'order_number': {'$regex': f'^SIP-{today}'}})
    return f"SIP-{today}-{count + 1:04d}"


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(input: UserRegister):
    """Kurye kaydı oluştur"""
    existing = await db.users.find_one({"username": input.username})
    if existing:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor")
    
    # Kurye kaydı oluştur
    courier = Courier(
        first_name=input.first_name,
        last_name=input.last_name,
        phone_number=input.phone_number,
        vehicle_type=input.vehicle_type,
        vehicle_plate=input.vehicle_plate,
        is_available=True,
        is_approved=False
    )
    courier_doc = courier.model_dump()
    courier_doc['created_at'] = courier_doc['created_at'].isoformat()
    await db.couriers.insert_one(courier_doc)
    
    # User kaydı oluştur
    user = User(
        username=input.username,
        role="courier",
        is_approved=False,
        courier_id=courier.id
    )
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(input.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    await db.users.insert_one(user_doc)
    
    return {"message": "Kayıt başarılı. Yönetici onayı bekleniyor."}

@api_router.post("/auth/login")
async def login(input: UserLogin):
    """Giriş yap"""
    user = await db.users.find_one({"username": input.username})
    if not user or not verify_password(input.password, user['password']):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    
    if user['role'] == 'courier' and not user.get('is_approved', False):
        raise HTTPException(status_code=403, detail="Hesabınız henüz onaylanmadı")
    
    token = create_access_token({
        "user_id": user['id'],
        "username": user['username'],
        "role": user['role'],
        "is_approved": user.get('is_approved', False),
        "courier_id": user.get('courier_id')
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user['id'],
            "username": user['username'],
            "role": user['role'],
            "is_approved": user.get('is_approved', False),
            "courier_id": user.get('courier_id')
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Mevcut kullanıcı bilgisi"""
    return user


# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/couriers/pending")
async def get_pending_couriers(user: dict = Depends(require_admin)):
    """Onay bekleyen kuryeler"""
    couriers = await db.couriers.find({"is_approved": False}, {"_id": 0}).to_list(100)
    for courier in couriers:
        if isinstance(courier['created_at'], str):
            courier['created_at'] = datetime.fromisoformat(courier['created_at'])
    return couriers

@api_router.put("/admin/couriers/{courier_id}/approve")
async def approve_courier(courier_id: str, user: dict = Depends(require_admin)):
    """Kuryeyi onayla"""
    # Courier'i onayla
    result = await db.couriers.update_one(
        {"id": courier_id},
        {"$set": {"is_approved": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kurye bulunamadı")
    
    # User'ı da onayla
    await db.users.update_one(
        {"courier_id": courier_id},
        {"$set": {"is_approved": True}}
    )
    
    return {"message": "Kurye onaylandı"}

@api_router.delete("/admin/couriers/{courier_id}")
async def delete_courier(courier_id: str, user: dict = Depends(require_admin)):
    """Kuryeyi sil"""
    # User'ı sil
    await db.users.delete_one({"courier_id": courier_id})
    
    # Courier'i sil
    result = await db.couriers.delete_one({"id": courier_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kurye bulunamadı")
    
    return {"message": "Kurye silindi"}

@api_router.get("/admin/stats/monthly")
async def get_monthly_stats(user: dict = Depends(require_admin)):
    """Aylık istatistikler"""
    now = datetime.now(timezone.utc)
    current_month = now.strftime('%Y%m')
    
    orders = await db.orders.find(
        {'order_number': {'$regex': f'^SIP-{current_month}'}, 'status': {'$ne': 'cancelled'}},
        {"_id": 0, "total_amount": 1, "status": 1}
    ).to_list(10000)
    
    total_revenue = sum(order.get('total_amount', 0) for order in orders)
    total_orders = len(orders)
    
    return {
        "month": now.strftime('%Y-%m'),
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "average_order": total_revenue / total_orders if total_orders > 0 else 0
    }

@api_router.get("/admin/stats/yearly")
async def get_yearly_stats(user: dict = Depends(require_admin)):
    """Yıllık istatistikler"""
    now = datetime.now(timezone.utc)
    current_year = now.strftime('%Y')
    
    orders = await db.orders.find(
        {'order_number': {'$regex': f'^SIP-{current_year}'}, 'status': {'$ne': 'cancelled'}},
        {"_id": 0, "total_amount": 1}
    ).to_list(100000)
    
    total_revenue = sum(order.get('total_amount', 0) for order in orders)
    total_orders = len(orders)
    
    return {
        "year": current_year,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "average_order": total_revenue / total_orders if total_orders > 0 else 0
    }

@api_router.get("/admin/export/orders")
async def export_orders(
    format: str = "excel",
    month: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """Siparişleri export et (Excel veya PDF)"""
    query = {}
    if month:
        query['order_number'] = {'$regex': f'^SIP-{month.replace("-", "")}'}
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
    
    if format == "excel":
        excel_bytes = excel_service.generate_orders_report(
            orders,
            title=f"Sipariş Raporu - {month or 'Tüm Zamanlar'}"
        )
        return StreamingResponse(
            iter([excel_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=siparisler-{month or 'tum'}.xlsx"}
        )
    else:
        raise HTTPException(status_code=400, detail="Sadece excel formatı destekleniyor")

@api_router.get("/admin/export/daily")
async def export_daily_and_clear(user: dict = Depends(require_admin)):
    """Günlük raporu indir ve o günün siparişlerini sil"""
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    
    # Bugünün siparişlerini getir
    orders = await db.orders.find(
        {'order_number': {'$regex': f'^SIP-{today}'}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10000)
    
    if len(orders) == 0:
        raise HTTPException(status_code=404, detail="Bugün sipariş bulunamadı")
    
    # Excel oluştur
    excel_bytes = excel_service.generate_orders_report(
        orders,
        title=f"Gün Sonu Raporu - {datetime.now(timezone.utc).strftime('%d.%m.%Y')}"
    )
    
    # Bugünün siparişlerini sil
    await db.orders.delete_many({'order_number': {'$regex': f'^SIP-{today}'}})
    
    return StreamingResponse(
        iter([excel_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=gun-sonu-{today}.xlsx"}
    )

@api_router.get("/admin/courier-stats")
async def get_courier_daily_stats(user: dict = Depends(require_admin)):
    """Kuryelerin bugünkü teslimat istatistikleri"""
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    
    # Bugün teslim edilen paket siparişleri
    delivered_orders = await db.orders.find(
        {
            'order_number': {'$regex': f'^SIP-{today}'},
            'order_type': 'takeaway',
            'status': 'delivered',
            'courier_id': {'$ne': None}
        },
        {"_id": 0, "courier_id": 1, "courier_name": 1, "total_amount": 1}
    ).to_list(10000)
    
    # Kurye bazında grupla
    stats = {}
    for order in delivered_orders:
        courier_id = order.get('courier_id')
        if courier_id:
            if courier_id not in stats:
                stats[courier_id] = {
                    'courier_id': courier_id,
                    'courier_name': order.get('courier_name', 'Bilinmeyen'),
                    'deliveries': 0,
                    'total_revenue': 0
                }
            stats[courier_id]['deliveries'] += 1
            stats[courier_id]['total_revenue'] += order.get('total_amount', 0)
    
    return list(stats.values())


# ==================== COURIER ROUTES ====================

@api_router.get("/courier/packages")
async def get_packages(user: dict = Depends(require_courier)):
    """Paket siparişleri getir (kurye için)"""
    orders = await db.orders.find(
        {
            "order_type": "takeaway",
            "status": {"$in": ["pending", "ready"]},
            "courier_id": None
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.get("/courier/my-orders")
async def get_my_orders(user: dict = Depends(require_courier)):
    """Kuryenin kendi siparişleri"""
    courier_id = user.get('courier_id')
    if not courier_id:
        raise HTTPException(status_code=400, detail="Kurye ID bulunamadı")
    
    orders = await db.orders.find(
        {"courier_id": courier_id, "status": {"$nin": ["delivered", "cancelled"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.put("/courier/orders/{order_id}/take")
async def take_order(order_id: str, user: dict = Depends(require_courier)):
    """Siparişi al"""
    courier_id = user.get('courier_id')
    if not courier_id:
        raise HTTPException(status_code=400, detail="Kurye ID bulunamadı")
    
    # Courier bilgilerini getir
    courier = await db.couriers.find_one({"id": courier_id})
    if not courier:
        raise HTTPException(status_code=404, detail="Kurye bulunamadı")
    
    courier_name = f"{courier['first_name']} {courier['last_name']}"
    
    # Siparişi güncelle
    result = await db.orders.update_one(
        {"id": order_id, "courier_id": None},
        {"$set": {
            "courier_id": courier_id,
            "courier_name": courier_name,
            "status": "preparing",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=400, detail="Sipariş zaten alınmış veya bulunamadı")
    
    # Kuryeyi meşgul yap
    await db.couriers.update_one(
        {"id": courier_id},
        {"$set": {"is_available": False}}
    )
    
    return {"message": "Sipariş alındı"}

@api_router.put("/courier/orders/{order_id}/deliver")
async def deliver_order(order_id: str, user: dict = Depends(require_courier)):
    """Siparişi teslim et"""
    courier_id = user.get('courier_id')
    
    result = await db.orders.update_one(
        {"id": order_id, "courier_id": courier_id},
        {"$set": {
            "status": "delivered",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # Kuryeyi müsait yap
    await db.couriers.update_one(
        {"id": courier_id},
        {"$set": {"is_available": True}}
    )
    
    return {"message": "Sipariş teslim edildi"}

@api_router.put("/courier/orders/{order_id}/cancel")
async def cancel_order_courier(order_id: str, user: dict = Depends(require_courier)):
    """Siparişi iptal et"""
    courier_id = user.get('courier_id')
    
    result = await db.orders.update_one(
        {"id": order_id, "courier_id": courier_id},
        {"$set": {
            "status": "cancelled",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # Kuryeyi müsait yap
    await db.couriers.update_one(
        {"id": courier_id},
        {"$set": {"is_available": True}}
    )
    
    return {"message": "Sipariş iptal edildi"}

@api_router.get("/courier/my-stats")
async def get_my_stats(user: dict = Depends(require_courier)):
    """Kuryenin bugünkü istatistikleri"""
    courier_id = user.get('courier_id')
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    
    # Bugün teslim edilen siparişler
    delivered = await db.orders.count_documents({
        'order_number': {'$regex': f'^SIP-{today}'},
        'courier_id': courier_id,
        'status': 'delivered'
    })
    
    # Bugünkü gelir
    delivered_orders = await db.orders.find(
        {
            'order_number': {'$regex': f'^SIP-{today}'},
            'courier_id': courier_id,
            'status': 'delivered'
        },
        {"_id": 0, "total_amount": 1}
    ).to_list(1000)
    
    total_revenue = sum(order.get('total_amount', 0) for order in delivered_orders)
    
    return {
        'deliveries_today': delivered,
        'revenue_today': total_revenue
    }

@api_router.get("/courier/my-history")
async def get_my_history(user: dict = Depends(require_courier)):
    """Kuryenin bugünkü sipariş geçmişi (tüm siparişler)"""
    courier_id = user.get('courier_id')
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    
    orders = await db.orders.find(
        {
            'order_number': {'$regex': f'^SIP-{today}'},
            'courier_id': courier_id
        },
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders


# ==================== PUBLIC ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Döner Restoranı POS API", "version": "2.0"}


# ========== CATEGORY ENDPOINTS ==========

@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate, user: dict = Depends(require_admin)):
    category = Category(**input.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.categories.insert_one(doc)
    return category

@api_router.get("/categories", response_model=List[Category])
async def get_categories(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    categories = await db.categories.find(query, {"_id": 0}).to_list(100)
    for cat in categories:
        if isinstance(cat['created_at'], str):
            cat['created_at'] = datetime.fromisoformat(cat['created_at'])
    return categories


# ========== PRODUCT ENDPOINTS ==========

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate, user: dict = Depends(require_admin)):
    category = await db.categories.find_one({"id": input.category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    
    product = Product(**input.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products(category_id: Optional[str] = None, available_only: bool = True):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if available_only:
        query["is_available"] = True
    
    products = await db.products.find(query, {"_id": 0}).to_list(200)
    for prod in products:
        if isinstance(prod['created_at'], str):
            prod['created_at'] = datetime.fromisoformat(prod['created_at'])
    return products


# ========== TABLE ENDPOINTS ==========

@api_router.post("/tables", response_model=Table)
async def create_table(input: TableCreate, user: dict = Depends(require_admin)):
    table = Table(**input.model_dump())
    doc = table.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.tables.insert_one(doc)
    return table

@api_router.get("/tables", response_model=List[Table])
async def get_tables():
    tables = await db.tables.find({}, {"_id": 0}).to_list(100)
    for table in tables:
        if isinstance(table['created_at'], str):
            table['created_at'] = datetime.fromisoformat(table['created_at'])
    return tables


# ========== COURIER ENDPOINTS (ADMIN) ==========

@api_router.get("/couriers", response_model=List[Courier])
async def get_couriers(available_only: bool = False, approved_only: bool = True):
    query = {}
    if available_only:
        query["is_available"] = True
    if approved_only:
        query["is_approved"] = True
    
    couriers = await db.couriers.find(query, {"_id": 0}).to_list(100)
    for courier in couriers:
        if isinstance(courier['created_at'], str):
            courier['created_at'] = datetime.fromisoformat(courier['created_at'])
    return couriers


# ========== ORDER ENDPOINTS ==========

@api_router.post("/orders", response_model=Order)
async def create_order(input: OrderCreate):
    total = sum(item.quantity * item.price for item in input.items)
    order_number = await get_next_order_number()
    
    table_name = None
    if input.table_id:
        table = await db.tables.find_one({"id": input.table_id})
        if table:
            table_name = f"Masa {table['table_number']}"
            await db.tables.update_one(
                {"id": input.table_id},
                {"$set": {"is_occupied": True}}
            )
    
    order = Order(
        order_number=order_number,
        items=input.items,
        total_amount=total,
        order_type=input.order_type,
        table_id=input.table_id,
        table_name=table_name,
        customer_name=input.customer_name,
        customer_phone=input.customer_phone,
        customer_address=input.customer_address,
        notes=input.notes
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.orders.insert_one(doc)
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(status: Optional[str] = None):
    query = {"status": status} if status else {}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    valid_statuses = ["pending", "preparing", "ready", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Geçersiz durum")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if status in ["delivered", "cancelled"]:
        if order.get('table_id'):
            await db.tables.update_one(
                {"id": order['table_id']},
                {"$set": {"is_occupied": False}}
            )
        if order.get('courier_id'):
            await db.couriers.update_one(
                {"id": order['courier_id']},
                {"$set": {"is_available": True}}
            )
    
    return {"message": "Sipariş durumu güncellendi"}

@api_router.get("/orders/{order_id}/receipt")
async def generate_receipt(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    try:
        pdf_bytes = pdf_service.generate_receipt(order)
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=fis-{order['order_number']}.pdf"
            }
        )
    except Exception as e:
        logging.error(f"PDF oluşturma hatası: {str(e)}")
        raise HTTPException(status_code=500, detail="PDF oluşturulamadı")


# ========== STATISTICS ENDPOINTS ==========

@api_router.get("/stats/dashboard")
async def get_dashboard_stats():
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    preparing_orders = await db.orders.count_documents({"status": "preparing"})
    
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    today_orders = await db.orders.count_documents({'order_number': {'$regex': f'^SIP-{today}'}})
    
    today_orders_data = await db.orders.find(
        {'order_number': {'$regex': f'^SIP-{today}'}, 'status': {'$ne': 'cancelled'}},
        {"_id": 0, "total_amount": 1}
    ).to_list(1000)
    today_revenue = sum(order.get('total_amount', 0) for order in today_orders_data)
    
    occupied_tables = await db.tables.count_documents({"is_occupied": True})
    available_couriers = await db.couriers.count_documents({"is_available": True, "is_approved": True})
    
    return {
        "total_orders": total_orders,
        "today_orders": today_orders,
        "today_revenue": today_revenue,
        "pending_orders": pending_orders,
        "preparing_orders": preparing_orders,
        "occupied_tables": occupied_tables,
        "available_couriers": available_couriers
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
