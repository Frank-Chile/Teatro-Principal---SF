from fastapi import Depends, HTTPException, status
from .auth import get_current_active_user, get_current_admin_user, get_current_client_user
from .schemas import UserSchema

# Estas son solo re-exportaciones para organizar, ya están definidas en auth.py
# Si auth.py crece mucho, se podrían mover aquí las funciones de obtención de usuario por rol.

async def get_admin(current_user: UserSchema = Depends(get_current_admin_user)):
    return current_user

async def get_client(current_user: UserSchema = Depends(get_current_client_user)):
    return current_user

async def get_active_user(current_user: UserSchema = Depends(get_current_active_user)):
    return current_user