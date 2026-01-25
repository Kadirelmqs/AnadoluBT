# Dosya Konumu: backend/create_user.py

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import uuid
from auth import hash_password # Senin auth.py dosyanı kullanır

# .env yükle
load_dotenv()

async def create_admin_user():
    # 1. Veritabanına Bağlan
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("HATA: .env dosyasında MONGO_URL bulunamadı!")
        return

    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'restoran_db')]
    
    # 2. Kullanıcı Bilgileri
    username = "admin"
    password = "123"  # Şifren bu olacak
    
    # Kontrol et: Zaten var mı?
    existing = await db.users.find_one({"username": username})
    if existing:
        print(f"⚠️  Uyarı: '{username}' kullanıcısı zaten var. Silip tekrar oluşturayım mı?")
        # İstersen buraya silme kodu eklersin ama şimdilik uyarıp geçelim
        return

    # 3. Kullanıcıyı Hazırla
    new_user = {
        "id": str(uuid.uuid4()),
        "username": username,
        "password": hash_password(password), # ŞİFREYİ HASH'LEMEK ŞART!
        "role": "admin",      # Admin her yere girer
        "is_approved": True,  # Onaylı olsun
        "created_at": "2024-01-01T00:00:00"
    }

    # 4. Kaydet
    try:
        await db.users.insert_one(new_user)
        print("------------------------------------------------")
        print("✅ BAŞARILI! Kullanıcı oluşturuldu.")
        print(f"👤 Kullanıcı Adı: {username}")
        print(f"🔑 Şifre: {password}")
        print("------------------------------------------------")
    except Exception as e:
        print(f"❌ HATA: {e}")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(create_admin_user())