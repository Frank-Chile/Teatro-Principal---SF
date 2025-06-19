from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models, crud
from .database import engine, SessionLocal
from .routers import auth_router, admin_router, client_router
<<<<<<< HEAD
from contextlib import asynccontextmanager
=======
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804

# Crea las tablas en la base de datos (si no existen)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Control de Asistencia al Teatro Principal",
    version="1.1.0",
    description="API para la gestión de funciones, butacas y ventas del Teatro Principal con persistencia de datos."
)

<<<<<<< HEAD
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Código que se ejecuta al iniciar la aplicación
    print("Iniciando aplicación y creando usuarios iniciales...")
    db = SessionLocal()
    crud.create_initial_users(db)
    db.close()
    yield
    # Código que se ejecuta al apagar la aplicación (si es necesario)
    print("Apagando aplicación...")

app = FastAPI(
    title="Sistema de Control de Asistencia al Teatro Principal",
    lifespan=lifespan
)
=======
# Evento de startup para crear usuarios iniciales
@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    crud.create_initial_users(db)
    db.close()
>>>>>>> 0fe73801a15485600472cdd6529e410b0789e804

# Configuración de CORS
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(client_router.router)

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Bienvenido al API del Teatro Principal"}