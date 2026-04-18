import pyotp
import redis

from app.core.config import REDIS_URL

redis_client = redis.from_url(REDIS_URL)

OTP_EXPIRY = {
    "verify": 180,
    "reset": 180,
}


def generate_otp() -> str:
    return pyotp.random_base32()[:6].upper()


def store_otp(user_id: str, otp: str, purpose: str) -> None:
    key = f"otp:{purpose}:{user_id}"
    expiry = OTP_EXPIRY[purpose]
    redis_client.setex(key, expiry, otp)


def verify_otp(user_id: str, otp: str, purpose: str) -> bool:
    key = f"otp:{purpose}:{user_id}"
    stored = redis_client.get(key)
    if not stored:
        return False
    if stored.decode() != otp.upper():
        return False
    redis_client.delete(key)
    return True
