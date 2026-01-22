import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# .env dosyasını bul ve yükle
CURRENT_DIR = Path(__file__).parent
load_dotenv(CURRENT_DIR / '.env')

async def test_connection():
    mongo_url = os.environ.get('MONGO_URL')
    
    print("------------------------------------------------")
    print("1. .env dosyası okunuyor...")
    if not mongo_url:
        print("❌ HATA: MONGO_URL bulunamadı! .env dosyasını kontrol et.")
        return

    print("2. MongoDB Atlas'a bağlanılıyor...")
    
    try:
        # Bağlantı istemcisi oluştur
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Sunucu bilgisini iste (Ping at)
        info = await client.server_info()
        
        print("✅ BAŞARILI! MongoDB Atlas'a bağlantı sağlandı.")
        print(f"   Sunucu Versiyonu: {info.get('version')}")
        
        db_name = os.environ.get('DB_NAME', 'test_database')
        print(f"   Hedef Veritabanı: {db_name}")
        
    except Exception as e:
        print("❌ HATA: Bağlantı başarısız!")
        print(f"   Hata Detayı: {e}")
        print("\n   İpuçları:")
        print("   - IP adresin MongoDB Network Access'te ekli mi? (0.0.0.0/0)")
        print("   - Şifrende özel karakterler varsa URL-Encode ettin mi?")
        print("   - İnternet bağlantın var mı?")

if __name__ == "__main__":
    # Windows için event loop politikası
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_connection())