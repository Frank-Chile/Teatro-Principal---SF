from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from . import models, crud
from .database import engine, SessionLocal
from .routers import auth_router, admin_router, client_router

models.Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    crud.create_initial_users(db)
    db.close()
    yield
    print("Application shutdown.")

app = FastAPI(
    title="Sistema de Control de Asistencia al Teatro Principal",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(client_router.router)

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Bienvenido al API del Teatro Principal"}