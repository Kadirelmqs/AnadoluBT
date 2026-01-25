# AnadoluBT/Dockerfile

# Python sürümü
FROM python:3.10-slim

# Çalışma dizini
WORKDIR /app

# Sistem kütüphanelerini güncelle
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Önce requirements dosyasını backend klasöründen kopyala
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Şimdi backend klasöründeki TÜM kodları içeri kopyala
COPY backend/ .

# Uygulamayı başlat (DİKKAT: server.py olduğu için server:app yaptık)
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]