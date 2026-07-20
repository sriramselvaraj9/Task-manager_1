from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_task_columns():
    if not settings.DATABASE_URL.startswith(("postgresql://", "postgresql+")):
        return

    statements = [
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE NOT NULL DEFAULT CURRENT_DATE",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'medium'",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE",
        "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE",
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

    seed_admin_user()

def seed_admin_user():
    from .models import User
    from .auth import get_password_hash
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            hashed_password = get_password_hash("adminpassword")
            admin = User(email="admin@example.com", hashed_password=hashed_password, is_admin=True)
            db.add(admin)
        else:
            # Make sure they are an admin and reset password to adminpassword just in case
            admin.is_admin = True
            admin.hashed_password = get_password_hash("adminpassword")
        
        db.commit()
    finally:
        db.close()