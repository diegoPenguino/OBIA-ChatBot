"""Seed script — creates 12 contest users + 1 admin in the database."""

import csv
import random
import string
import sys
import os

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import User
from app.auth import hash_password
from app.config import get_settings

settings = get_settings()

CREDENTIALS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "credentials.csv")


def generate_password(length: int = 10) -> str:
    """Generate a random lowercase alphabetic password."""
    return "".join(random.choices(string.ascii_lowercase, k=length))


def seed():
    """Create all tables and seed users."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        existing = db.query(User).count()
        if existing > 0:
            print(f"Database already has {existing} users. Skipping seed.")
            return

        credentials: list[dict[str, str]] = []

        # Admin user
        admin = User(
            username="admin",
            password_hash=hash_password(settings.ADMIN_PASSWORD),
            is_admin=True,
            max_requests=9999,
        )
        db.add(admin)
        credentials.append({"username": "admin", "password": settings.ADMIN_PASSWORD})

        # Load students from students.csv
        students_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "students.csv")
        
        if not os.path.exists(students_file):
            print(f"⚠️ {students_file} not found. No students seeded.")
        else:
            with open(students_file, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    user = User(
                        username=row["username"],
                        first_name=row["FirstName"],
                        last_name=row["LastName"],
                        password_hash=hash_password(row["password"]),
                        is_admin=False,
                        max_requests=settings.DEFAULT_MAX_REQUESTS,
                    )
                    db.add(user)
                    credentials.append({"username": row["username"], "password": row["password"]})

        db.commit()

        # Save actual credentials used to a confirmation file
        with open(CREDENTIALS_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["username", "password"])
            writer.writeheader()
            writer.writerows(credentials)

        print("✅ Seeded admin + students from CSV successfully.")
        print(f"📄 Credentials saved to: {CREDENTIALS_FILE}")
        print()
        for cred in credentials:
            print(f"  {cred['username']:12s} | {cred['password']}")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
