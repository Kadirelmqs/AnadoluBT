from fastapi import FastAPI, APIRouter, HTTPException, Response
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# PDF Servisi
pdf_service = PDFReceiptService()

# Create the main app
app = FastAPI(title="Döner Restoranı POS API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

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

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None

class Courier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    phone_number: str
    vehicle_type: str  # "Bisiklet", "Motosiklet", "Araba"
    vehicle_plate: Optional[str] = None
    is_available: bool = True
    current_location: Optional[str] = None
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
    status: str = "pending"  # pending, preparing, ready, delivered, cancelled
    order_type: str = "dine-in"  # dine-in, takeaway, delivery
    table_id: Optional[str] = None
    table_name: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    courier_id: Optional[str] = None
    courier_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    order_type: str = "dine-in"
    table_id: Optional[str] = None
    customer_id: Optional[str] = None
    courier_id: Optional[str] = None
    notes: Optional[str] = None

class AssignCourier(BaseModel):
    courier_id: str


# ==================== HELPER FUNCTIONS ====================

async def get_next_order_number() -> str:
    """Yeni sipariş numarası oluştur"""
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    count = await db.orders.count_documents({'order_number': {'$regex': f'^SIP-{today}'}})
    return f"SIP-{today}-{count + 1:04d}"


# ==================== ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Döner Restoranı POS API", "version": "1.0"}


# ========== CATEGORY ENDPOINTS ==========

@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
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

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not category:
        raise HTTPException(status_code=404, detail="Kategori bulunamadı")
    if isinstance(category['created_at'], str):
        category['created_at'] = datetime.fromisoformat(category['created_at'])
    return category


# ========== PRODUCT ENDPOINTS ==========

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
    # Kategori var mı kontrol et
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

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.put("/products/{product_id}/availability")
async def update_product_availability(product_id: str, is_available: bool):
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_available": is_available}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {"message": "Ürün durumu güncellendi"}


# ========== TABLE ENDPOINTS ==========

@api_router.post("/tables", response_model=Table)
async def create_table(input: TableCreate):
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

@api_router.put("/tables/{table_id}/status")
async def update_table_status(table_id: str, is_occupied: bool):
    result = await db.tables.update_one(
        {"id": table_id},
        {"$set": {"is_occupied": is_occupied}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Masa bulunamadı")
    return {"message": "Masa durumu güncellendi"}


# ========== CUSTOMER ENDPOINTS ==========

@api_router.post("/customers", response_model=Customer)
async def create_customer(input: CustomerCreate):
    customer = Customer(**input.model_dump())
    doc = customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    return customer

@api_router.get("/customers", response_model=List[Customer])
async def get_customers():
    customers = await db.customers.find({}, {"_id": 0}).to_list(200)
    for cust in customers:
        if isinstance(cust['created_at'], str):
            cust['created_at'] = datetime.fromisoformat(cust['created_at'])
    return customers


# ========== COURIER ENDPOINTS ==========

@api_router.post("/couriers", response_model=Courier)
async def create_courier(input: CourierCreate):
    courier = Courier(**input.model_dump())
    doc = courier.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.couriers.insert_one(doc)
    return courier

@api_router.get("/couriers", response_model=List[Courier])
async def get_couriers(available_only: bool = False):
    query = {"is_available": True} if available_only else {}
    couriers = await db.couriers.find(query, {"_id": 0}).to_list(100)
    for courier in couriers:
        if isinstance(courier['created_at'], str):
            courier['created_at'] = datetime.fromisoformat(courier['created_at'])
    return couriers

@api_router.put("/couriers/{courier_id}/availability")
async def update_courier_availability(courier_id: str, is_available: bool):
    result = await db.couriers.update_one(
        {"id": courier_id},
        {"$set": {"is_available": is_available}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kurye bulunamadı")
    return {"message": "Kurye durumu güncellendi"}


# ========== ORDER ENDPOINTS ==========

@api_router.post("/orders", response_model=Order)
async def create_order(input: OrderCreate):
    # Toplam tutarı hesapla
    total = sum(item.quantity * item.price for item in input.items)
    
    # Sipariş numarası oluştur
    order_number = await get_next_order_number()
    
    # İlişkili bilgileri getir
    table_name = None
    customer_name = None
    courier_name = None
    
    if input.table_id:
        table = await db.tables.find_one({"id": input.table_id})
        if table:
            table_name = f"Masa {table['table_number']}"
            # Masayı dolu yap
            await db.tables.update_one(
                {"id": input.table_id},
                {"$set": {"is_occupied": True}}
            )
    
    if input.customer_id:
        customer = await db.customers.find_one({"id": input.customer_id})
        if customer:
            customer_name = customer['name']
    
    if input.courier_id:
        courier = await db.couriers.find_one({"id": input.courier_id})
        if courier:
            courier_name = f"{courier['first_name']} {courier['last_name']}"
            # Kuryeyi müsait değil yap
            await db.couriers.update_one(
                {"id": input.courier_id},
                {"$set": {"is_available": False}}
            )
    
    order = Order(
        order_number=order_number,
        items=input.items,
        total_amount=total,
        order_type=input.order_type,
        table_id=input.table_id,
        table_name=table_name,
        customer_id=input.customer_id,
        customer_name=customer_name,
        courier_id=input.courier_id,
        courier_name=courier_name,
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

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order['updated_at'], str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    """Sipariş durumunu güncelle"""
    valid_statuses = ["pending", "preparing", "ready", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Geçersiz durum")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Sipariş tamamlandıysa masa ve kuryeyi serbest bırak
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

@api_router.put("/orders/{order_id}/assign-courier")
async def assign_courier_to_order(order_id: str, input: AssignCourier):
    """Siparişe kurye ata"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    courier = await db.couriers.find_one({"id": input.courier_id})
    if not courier:
        raise HTTPException(status_code=404, detail="Kurye bulunamadı")
    
    if not courier.get('is_available', False):
        raise HTTPException(status_code=400, detail="Kurye müsait değil")
    
    courier_name = f"{courier['first_name']} {courier['last_name']}"
    
    # Siparişi güncelle
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "courier_id": input.courier_id,
            "courier_name": courier_name,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Kuryeyi müsait değil yap
    await db.couriers.update_one(
        {"id": input.courier_id},
        {"$set": {"is_available": False}}
    )
    
    return {"message": "Kurye atandı", "courier_name": courier_name}

@api_router.get("/orders/{order_id}/receipt")
async def generate_receipt(order_id: str):
    """Sipariş fişi PDF oluştur ve döndür"""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    
    # PDF oluştur
    try:
        pdf_bytes = pdf_service.generate_receipt(order)
        
        # PDF'i stream olarak döndür
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
    """Dashboard istatistikleri"""
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    preparing_orders = await db.orders.count_documents({"status": "preparing"})
    
    # Bugünkü siparişler
    today = datetime.now(timezone.utc).strftime('%Y%m%d')
    today_orders = await db.orders.count_documents({'order_number': {'$regex': f'^SIP-{today}'}})
    
    # Toplam gelir (bugün)
    today_orders_data = await db.orders.find(
        {'order_number': {'$regex': f'^SIP-{today}'}, 'status': {'$ne': 'cancelled'}},
        {"_id": 0, "total_amount": 1}
    ).to_list(1000)
    today_revenue = sum(order.get('total_amount', 0) for order in today_orders_data)
    
    occupied_tables = await db.tables.count_documents({"is_occupied": True})
    available_couriers = await db.couriers.count_documents({"is_available": True})
    
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
