# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# URL de conexión para SQLite. El archivo se creará en el directorio raíz del backend.
SQLALCHEMY_DATABASE_URL = "sqlite:///./teatro_principal.db"

# create_engine es el punto de entrada a la base de datos.
# connect_args es solo para SQLite para permitir que un solo hilo la use.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Cada instancia de SessionLocal será una sesión de base de datos.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base será usada para crear cada uno de los modelos de la base de datos (tablas).
Base = declarative_base()