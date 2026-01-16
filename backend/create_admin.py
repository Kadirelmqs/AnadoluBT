import asyncio
import sys
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from auth import hash_password
import uuid

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

async def create_admin():
    """Admin kullanıcı oluştur"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # Mevcut admin var mı kontrol et
    existing_admin = await db.users.find_one({"username": "admin"})
    if existing_admin:
        print("✓ Admin kullanıcısı zaten mevcut")
        client.close()
        return
    
    # Admin kullanıcısı oluştur
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "password": hash_password("admin123"),
        "role": "admin",
        "is_approved": True,
        "courier_id": None,
        "created_at": "2025-01-01T10:00:00"
    }
    
    await db.users.insert_one(admin_user)
    print("✅ Admin kullanıcısı oluşturuldu")
    print("   Kullanıcı adı: admin")
    print("   Şifre: admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
