from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Ensure this import is present

from .routers import auth_router, admin_router, client_router

app = FastAPI(
    title="Sistema de Control de Asistencia al Teatro Principal",
    version="0.1.0",
    description="API para la gestión de funciones, butacas y ventas del Teatro Principal."
)

# Configuración de CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost",         # General localhost
    "http://localhost:3000",    # Common port for Create React App
    "http://localhost:5173",    # <<< YOUR FRONTEND ORIGIN - MAKE SURE THIS IS PRESENT
    # Add other origins if needed, e.g., your deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of origins that are allowed to make requests
    allow_credentials=True, # Allows cookies to be included in requests
    allow_methods=["*"],    # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allows all headers
)

# Include routers
app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(client_router.router)

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Bienvenido al API del Teatro Principal"}