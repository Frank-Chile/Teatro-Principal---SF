# backend/app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from sqlalchemy.orm import Session

from .. import auth, schemas, crud
from ..dependencies import get_db

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserSchema, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreateSchema, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario en el sistema con el rol de 'cliente'.
    """
    
    db_user = crud.get_user_by_username(db, username=user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso.")
    db_email = crud.get_user_by_email(db, email=user_in.email)
    if db_email:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")
    
    return crud.create_user(db=db, user=user_in)

@router.post("/token")
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Inicia sesión y establece una cookie HttpOnly con el token JWT.
    """
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "rol": user.rol}, expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax",
        path="/"
    )
    
    return {"msg": "Login exitoso"}

@router.post("/logout")
def logout(response: Response):
    """
    Cierra la sesión del usuario eliminando la cookie de autenticación.
    """
    response.delete_cookie(key="access_token")
    return {"msg": "Logout exitoso"}

@router.get("/users/me", response_model=schemas.UserSchema)
async def read_users_me(current_user: schemas.UserSchema = Depends(auth.get_current_active_user)):
    """
    Devuelve la información del usuario actualmente autenticado.
    """
    return current_user