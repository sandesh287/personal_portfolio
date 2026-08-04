from getpass import getpass

from app.auth.security import hash_password
from app.core.settings import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.repositories.user_repository import UserRepository


def seed_admin() -> None:
    email = settings.admin_email or input("Admin email: ").strip()
    password = settings.admin_password or getpass("Admin password: ")

    if not email:
        raise ValueError("Admin email is required.")

    if len(password) < 8:
        raise ValueError("Admin password must be at least 8 characters.")

    with SessionLocal() as db:
        user_repository = UserRepository(db)
        existing_user = user_repository.get_by_email(email)

        if existing_user is not None:
            print(f"Admin user already exists: {email}")
            return

        user_repository.add(
            User(
                email=email,
                password_hash=hash_password(password),
                is_active=True,
            )
        )
        db.commit()

    print(f"Admin user created: {email}")


if __name__ == "__main__":
    seed_admin()
