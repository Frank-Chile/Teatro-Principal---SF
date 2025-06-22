import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base
from app.dependencies import get_db
from app import schemas

# --- Configuración de la Base de Datos de Prueba en Memoria ---

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Fixture para la Sesión de la Base de Datos ---

@pytest.fixture()
def db_session():
    """
    Crea una base de datos y una sesión nuevas para cada prueba,
    y las limpia al finalizar.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

# --- Fixture para el Cliente de API de Prueba ---

@pytest.fixture()
def client(db_session):
    """
    Crea un TestClient que usa la base de datos de prueba
    al sobreescribir la dependencia get_db.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    # Sobreescribe la dependencia get_db con la de prueba
    app.dependency_overrides[get_db] = override_get_db

    # Crea un cliente de prueba
    yield TestClient(app)

    # Limpia la sobreescritura después de la prueba
    app.dependency_overrides.clear()

# --- Fixture para Simular un Usuario Admin Autenticado ---

@pytest.fixture
def admin_auth_client(client):
    """
    Simula un cliente ya autenticado como admin sobreescribiendo
    la dependencia de autenticación.
    """
    def override_get_current_admin_user():
        return schemas.UserSchema(username="testadmin", rol="admin", disabled=False)

    app.dependency_overrides[auth.get_current_admin_user] = override_get_current_admin_user
    return client