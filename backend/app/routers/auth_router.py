from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta

from .. import auth, schemas, crud # Ajuste de importación para crud

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = auth.get_user_from_db(username=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username, "rol": user.rol}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.UserSchema)
async def read_users_me(current_user: schemas.UserSchema = Depends(auth.get_current_active_user)):
    return current_user

# Endpoint de ejemplo para crear un usuario (podría ser solo para admins)
@router.post("/users/create", response_model=schemas.UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(user_in: schemas.UserCreateSchema):
    # Aquí podrías añadir lógica para que solo un admin pueda crear otros admins, etc.
    # o si es un registro público (no parece ser el caso aquí).
    # Por simplicidad, cualquiera puede crear por ahora, o puedes protegerlo:
    # current_admin: schemas.UserSchema = Depends(auth.get_current_admin_user)
    try:
        db_user = crud.create_db_user(user_in=user_in)
        return schemas.UserSchema.model_validate(db_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/hash-password/{password}")
async def get_password_hash_endpoint(password: str):
    return {"password": password, "hashed_password": auth.get_password_hash(password)}