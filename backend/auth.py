import jwt
from datetime import datetime, timedelta, timezone
from passlib.hash import bcrypt
import os
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = os.environ.get('SECRET_KEY', 'super-secret-key-change-in-production')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 gün

security = HTTPBearer()


def hash_password(password: str) -> str:
    """Şifreyi hashle"""
    return bcrypt.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Şifre doğrula"""
    return bcrypt.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """JWT token oluştur"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict:
    """JWT token çöz"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token süresi doldu')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Geçersiz token')


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Token'dan kullanıcı bilgisi al"""
    token = credentials.credentials
    payload = decode_token(token)
    return payload


async def require_admin(user: dict = Security(get_current_user)):
    """Admin yetkisi kontrolü"""
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Yetkisiz erişim')
    return user


async def require_courier(user: dict = Security(get_current_user)):
    """Kurye yetkisi kontrolü"""
    if user.get('role') != 'courier':
        raise HTTPException(status_code=403, detail='Sadece kuryeler erişebilir')
    if not user.get('is_approved'):
        raise HTTPException(status_code=403, detail='Hesabınız henüz onaylanmadı')
    return user