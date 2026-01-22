import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import uuid
import sys

# Dosyanın bulunduğu klasörü bul
CURRENT_DIR = Path(__file__).parent

# auth.py dosyasını bulabilmesi için sistem yoluna ekle
sys.path.append(str(CURRENT_DIR))

# .env dosyasını yükle
load_dotenv(CURRENT_DIR / '.env')

# auth modülünden şifreleme fonksiyonunu al
try:
    from auth import hash_password
except ImportError:
    print("HATA: 'auth.py' dosyası bulunamadı! Bu script 'backend' klasöründe olmalı.")
    sys.exit(1)

async def create_admin():
    print("------------------------------------------------")
    print("Admin oluşturma işlemi başlıyor...")

    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("❌ HATA: .env dosyasında MONGO_URL bulunamadı!")
        return

    try:
        # Veritabanına bağlan
        client = AsyncIOMotorClient(mongo_url)
        db_name = os.environ.get('DB_NAME', 'test_database')
        db = client[db_name]
        
        # Bağlantıyı test et
        await client.server_info()
    except Exception as e:
        print(f"❌ HATA: Veritabanına bağlanılamadı. Hata: {e}")
        return

    # KULLANICI BİLGİLERİ (İstersen burayı değiştirebilirsin)
    username = "admin"
    password = "admin123"

    # Zaten var mı kontrol et
    existing_user = await db.users.find_one({"username": username})
    if existing_user:
        print(f"⚠️ UYARI: '{username}' kullanıcısı zaten mevcut. İşlem yapılmadı.")
        client.close()
        return

    # Admin kullanıcısını oluştur (auth.py ile şifreleyerek)
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": username,
        "password": hash_password(password), # Şifreyi güvenli hale getir
        "role": "admin",
        "is_approved": True,  # Admin direkt onaylıdır
        "courier_id": None,
        "created_at": "2025-01-01T10:00:00"
    }

    try:
        await db.users.insert_one(admin_user)
        print("✅ BAŞARILI! Admin kullanıcısı oluşturuldu.")
        print(f"   Kullanıcı Adı: {username}")
        print(f"   Şifre: {password}")
        print("   (Lütfen tarayıcıdan giriş yapmayı dene)")
    except Exception as e:
        print(f"❌ HATA: Kayıt sırasında sorun oluştu: {e}")
    
    client.close()
    print("------------------------------------------------")

if __name__ == "__main__":
    # Windows için gerekli ayar
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
    asyncio.run(create_admin())