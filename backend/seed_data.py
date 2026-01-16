import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

async def seed_data():
    """Veritabanına örnek veri ekle"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("Örnek veriler ekleniyor...")
    
    # Kategoriler
    categories = [
        {"id": "cat-1", "name": "Dönerler", "description": "Lezzetli döner çeşitleri", "is_active": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "cat-2", "name": "İçecekler", "description": "Soğuk ve sıcak içecekler", "is_active": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "cat-3", "name": "Tatlılar", "description": "Tatlı çeşitleri", "is_active": True, "created_at": "2025-01-01T10:00:00"},
    ]
    
    await db.categories.delete_many({})
    await db.categories.insert_many(categories)
    print(f"✓ {len(categories)} kategori eklendi")
    
    # Ürünler
    products = [
        {"id": "prod-1", "name": "Tavuk Döner", "description": "Izgara tavuk döner", "price": 85.0, "category_id": "cat-1", "is_available": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "prod-2", "name": "Et Döner", "description": "Dana et döner", "price": 95.0, "category_id": "cat-1", "is_available": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "prod-3", "name": "Karışık Döner", "description": "Tavuk ve et karışık", "price": 90.0, "category_id": "cat-1", "is_available": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "prod-4", "name": "Ayran", "description": "Ev yapımı ayran", "price": 15.0, "category_id": "cat-2", "is_available": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "prod-5", "name": "Kola", "description": "330ml kola", "price": 20.0, "category_id": "cat-2", "is_available": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "prod-6", "name": "Sütlaç", "description": "Fırın sütlaç", "price": 35.0, "category_id": "cat-3", "is_available": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "prod-7", "name": "Baklava", "description": "Antep fıstıklı baklava", "price": 40.0, "category_id": "cat-3", "is_available": True, "created_at": "2025-01-01T10:00:00"},
    ]
    
    await db.products.delete_many({})
    await db.products.insert_many(products)
    print(f"✓ {len(products)} ürün eklendi")
    
    # Masalar
    tables = []
    for i in range(1, 13):
        tables.append({
            "id": f"table-{i}",
            "table_number": str(i),
            "capacity": 4 if i % 2 == 0 else 2,
            "is_occupied": False,
            "created_at": "2025-01-01T10:00:00"
        })
    
    await db.tables.delete_many({})
    await db.tables.insert_many(tables)
    print(f"✓ {len(tables)} masa eklendi")
    
    # Kuryeler
    couriers = [
        {"id": "courier-1", "first_name": "Ahmet", "last_name": "Yılmaz", "phone_number": "0555-111-2233", "vehicle_type": "Motosiklet", "vehicle_plate": "34 ABC 123", "is_available": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "courier-2", "first_name": "Mehmet", "last_name": "Demir", "phone_number": "0555-444-5566", "vehicle_type": "Bisiklet", "vehicle_plate": None, "is_available": True, "created_at": "2025-01-01T10:00:00"},
        {"id": "courier-3", "first_name": "Ayşe", "last_name": "Kaya", "phone_number": "0555-777-8899", "vehicle_type": "Araba", "vehicle_plate": "34 XYZ 789", "is_available": True, "created_at": "2025-01-01T10:00:00"},
    ]
    
    await db.couriers.delete_many({})
    await db.couriers.insert_many(couriers)
    print(f"✓ {len(couriers)} kurye eklendi")
    
    # Müşteriler
    customers = [
        {"id": "cust-1", "name": "Misafir", "phone": None, "address": None, "created_at": "2025-01-01T10:00:00"},
    ]
    
    await db.customers.delete_many({})
    await db.customers.insert_many(customers)
    print(f"✓ {len(customers)} müşteri eklendi")
    
    print("\n✅ Tüm örnek veriler başarıyla eklendi!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
