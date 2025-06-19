from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import crud, schemas, models
from .dependencies import get_db

# --- Configuración de Seguridad ---
SECRET_KEY = "UNA_CLAVE_SECRETA_MUY_MUY_SEGURA_PARA_PRODUCCION_CAMBIAR"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Duración del token en minutos

# --- Contexto de Hashing de Contraseñas ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Clase Personalizada para leer el JWT desde una Cookie HttpOnly ---
class OAuth2PasswordBearerFromCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        """
        Sobrescribe el comportamiento por defecto para buscar el token
        en una cookie llamada 'access_token' en lugar de la cabecera 'Authorization'.
        """
        token = request.cookies.get("access_token") # El nombre de la cookie que establecimos
        
        if not token:
            # Si no hay cookie, el usuario no está autenticado.
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return token

# Se instancia el nuevo esquema de seguridad personalizado
oauth2_scheme = OAuth2PasswordBearerFromCookie(tokenUrl="/auth/token")

# --- Funciones de Utilidad de Contraseña ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña en texto plano contra su hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera un hash para una contraseña en texto plano."""
    return pwd_context.hash(password)

# --- Funciones de Token JWT ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un nuevo token de acceso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Lógica de Autenticación y Dependencias ---

def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    """
    Busca un usuario en la base de datos y verifica su contraseña.
    Devuelve el objeto de usuario si es válido, de lo contrario, devuelve None.
    """
    user = crud.get_user_by_username(db, username=username)
    if not user:
        return None # Usuario no encontrado
    if not verify_password(password, user.hashed_password):
        return None # Contraseña incorrecta
    return user

async def get_current_user(
    token_with_bearer: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> schemas.UserSchema:
    """
    Dependencia de FastAPI para obtener el usuario actual a partir de un token JWT desde la cookie.
    Decodifica el token, extrae el nombre de usuario y busca al usuario en la base de datos.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # El valor de la cookie es "Bearer <token>", así que lo separamos
    parts = token_with_bearer.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise credentials_exception
    token = parts[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_username(db, username=token_data.username)
    
    if user is None:
        raise credentials_exception
    
    # Retorna un schema de Pydantic, no el modelo de SQLAlchemy directamente
    return schemas.UserSchema.model_validate(user)

async def get_current_active_user(
    current_user: schemas.UserSchema = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> schemas.UserSchema:
    """
    Dependencia que asegura que el usuario obtenido del token no esté deshabilitado.
    Realiza una comprobación fresca contra la base de datos.
    """
    user_in_db = crud.get_user_by_username(db, current_user.username)
    if user_in_db and user_in_db.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(
    current_user: schemas.UserSchema = Depends(get_current_active_user)
) -> schemas.UserSchema:
    """Dependencia que asegura que el usuario actual tenga el rol de 'admin'."""
    if current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted: Requires admin role"
        )
    return current_user

async def get_current_client_user(
    current_user: schemas.UserSchema = Depends(get_current_active_user)
) -> schemas.UserSchema:
    """Dependencia que asegura que el usuario actual tenga el rol de 'cliente'."""
    if current_user.rol != "cliente":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted: Requires client role"
        )
    return current_user