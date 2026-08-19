import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import jwt, JWTError, ExpiredSignatureError
from passlib.context import CryptContext

# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

print("=" * 60)
print("SECRET_KEY:", SECRET_KEY)
print("ALGORITHM :", ALGORITHM)
print("TOKEN EXPIRE:", ACCESS_TOKEN_EXPIRE_MINUTES, "minutes")
print("=" * 60)

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY not found in .env")

# ==========================================
# PASSWORD HASHING
# ==========================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ==========================================
# CREATE JWT TOKEN
# ==========================================

def create_access_token(data: dict) -> str:

    payload = data.copy()

    current_time = datetime.now(timezone.utc)

    expire = current_time + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload["exp"] = expire

    print("\n" + "=" * 60)
    print("CREATING JWT")
    print("CURRENT UTC :", current_time)
    print("EXPIRES AT  :", expire)
    print("=" * 60)

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    print("TOKEN CREATED")
    print(token)
    print("=" * 60 + "\n")

    return token


# ==========================================
# VERIFY JWT TOKEN
# ==========================================

def decode_access_token(token: str):

    try:

        print("\n" + "=" * 60)
        print("VERIFYING TOKEN")
        print("CURRENT UTC :", datetime.now(timezone.utc))
        print("TOKEN :", token)
        print("=" * 60)

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        print("JWT PAYLOAD:")
        print(payload)
        print("=" * 60 + "\n")

        return payload

    except ExpiredSignatureError:

        print("\n❌ JWT ERROR : TOKEN EXPIRED\n")
        return None

    except JWTError as e:

        print("\n❌ JWT ERROR :", str(e), "\n")
        return None

    except Exception as e:

        print("\n❌ UNKNOWN ERROR :", str(e), "\n")
        return None