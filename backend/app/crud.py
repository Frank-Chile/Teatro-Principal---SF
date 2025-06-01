from typing import List, Optional, Dict, Union, Any
from fastapi import HTTPException, status
from datetime import datetime, timedelta
from .models import (
    Funcion, ButacaModelUnion, Platea, Balcon, User, UserInDB,
    db_funciones_data, db_users_data, MAX_FUNCIONES_ACTIVAS
)
from .schemas import (
    UserCreateSchema, ButacaCreateSchemaUnion, ButacaUpdateSchema,
    FuncionCreateSchema, FuncionUpdateSchema
)
from .auth import get_password_hash

# --- CRUD Usuarios (Ejemplo, no solicitado explícitamente pero útil) ---
def create_db_user(user_in: UserCreateSchema) -> UserInDB:
    if user_in.username in db_users_data:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user_in.password)
    db_user = UserInDB(**user_in.model_dump(exclude={"password"}), hashed_password=hashed_password)
    db_users_data[db_user.username] = db_user
    return db_user

# --- CRUD Funciones ---
def get_funcion_by_id(funcion_id: str) -> Optional[Funcion]:
    return db_funciones_data.get(funcion_id)

def get_all_funciones() -> List[Funcion]:
    return list(db_funciones_data.values())

def get_active_funciones(limit: Optional[int] = None) -> List[Funcion]:
    active = sorted(
        [f for f in db_funciones_data.values() if f.activa],
        key=lambda f: f.fecha_hora,
        reverse=True # Más recientes primero
    )
    return active[:limit] if limit else active


def create_db_funcion(funcion_in: FuncionCreateSchema) -> Funcion:
    active_funciones_count = len([f for f in db_funciones_data.values() if f.activa])
    if active_funciones_count >= MAX_FUNCIONES_ACTIVAS: # HU-Admin-CrearFuncion (límite)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pueden crear más funciones. Límite de {MAX_FUNCIONES_ACTIVAS} funciones activas alcanzado."
        )
    
    funcion = Funcion(**funcion_in.model_dump())
    db_funciones_data[funcion.id] = funcion
    return funcion

def update_db_funcion(funcion_id: str, funcion_in: FuncionUpdateSchema) -> Optional[Funcion]:
    funcion = get_funcion_by_id(funcion_id)
    if not funcion:
        return None
    
    update_data = funcion_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(funcion, key, value)
    
    # Revalidar límite si se está activando una función
    if 'activa' in update_data and funcion.activa:
        active_funciones_count = len([f for f in db_funciones_data.values() if f.activa])
        if active_funciones_count > MAX_FUNCIONES_ACTIVAS:
             # Revertir si excede (o manejar de otra forma)
            funcion.activa = False 
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede activar. Límite de {MAX_FUNCIONES_ACTIVAS} funciones activas excedido."
            )
    db_funciones_data[funcion.id] = funcion # Guardar cambios
    return funcion

def delete_db_funcion(funcion_id: str) -> bool:
    if funcion_id in db_funciones_data:
        # Considerar lógica adicional, como no eliminar si hay butacas vendidas, etc.
        del db_funciones_data[funcion_id]
        return True
    return False

# --- CRUD Butacas (dentro de una función) ---
def add_butaca_to_funcion(funcion_id: str, butaca_data: ButacaCreateSchemaUnion) -> Optional[ButacaModelUnion]: # HU1 [cite: 3]
    funcion = get_funcion_by_id(funcion_id)
    if not funcion:
        return None

    # Validar que no exista una butaca en la misma fila y número [cite: 14]
    if funcion.get_butaca_by_posicion(butaca_data.fila, butaca_data.numero):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Butaca en Fila {butaca_data.fila}, Número {butaca_data.numero} ya existe en esta función."
        )

    if butaca_data.tipo_butaca == "platea":
        nueva_butaca = Platea(**butaca_data.model_dump())
    elif butaca_data.tipo_butaca == "balcon":
        nueva_butaca = Balcon(**butaca_data.model_dump())
    else:
        # Esto no debería ocurrir si Pydantic valida bien el Union
        raise HTTPException(status_code=400, detail="Tipo de butaca no válido")
    
    funcion.butacas.append(nueva_butaca)
    return nueva_butaca

def update_butaca_in_funcion(funcion_id: str, butaca_id: str, butaca_update_data: ButacaUpdateSchema) -> Optional[ButacaModelUnion]: # HU2 [cite: 5]
    funcion = get_funcion_by_id(funcion_id)
    if not funcion:
        return None
    
    butaca = funcion.get_butaca_by_id(butaca_id)
    if not butaca:
        return None

    update_data = butaca_update_data.model_dump(exclude_unset=True)

    # Evitar colisión al cambiar fila/número [cite: 14]
    new_fila = update_data.get('fila', butaca.fila)
    new_numero = update_data.get('numero', butaca.numero)
    if (new_fila != butaca.fila or new_numero != butaca.numero):
        for b_existente in funcion.butacas:
            if b_existente.id != butaca_id and \
               b_existente.fila == new_fila and \
               b_existente.numero == new_numero:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Actualización crearía duplicado: F{new_fila}-N{new_numero} ya existe."
                )
    
    for key, value in update_data.items():
        if hasattr(butaca, key):
            setattr(butaca, key, value)
        elif butaca.tipo_butaca == "platea" and isinstance(butaca, Platea) and hasattr(Platea, key):
            setattr(butaca, key, value)
        elif butaca.tipo_butaca == "balcon" and isinstance(butaca, Balcon) and hasattr(Balcon, key):
            setattr(butaca, key, value)
            
    return butaca

def delete_butaca_from_funcion(funcion_id: str, butaca_id: str) -> bool: # HU3 [cite: 7]
    funcion = get_funcion_by_id(funcion_id)
    if not funcion:
        return False
    
    butaca = funcion.get_butaca_by_id(butaca_id)
    if not butaca:
        return False
    
    if butaca.vendida: # HU3 [cite: 8]
        raise HTTPException(status_code=400, detail="No se puede eliminar una butaca vendida.")
        
    funcion.butacas = [b for b in funcion.butacas if b.id != butaca_id]
    return True

def get_butaca_from_funcion_by_posicion(funcion_id: str, fila: int, numero: int) -> Optional[ButacaModelUnion]: # HU10 [cite: 10]
    funcion = get_funcion_by_id(funcion_id)
    if not funcion:
        return None
    return funcion.get_butaca_by_posicion(fila, numero)

def vender_butacas_funcion(funcion_id: str, ids_butacas_a_vender: List[str]) -> List[ButacaModelUnion]: # HU4 [cite: 16]
    funcion = get_funcion_by_id(funcion_id)
    if not funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    butacas_vendidas_info = []
    monto_total_venta_actual = 0.0

    for butaca_id in ids_butacas_a_vender:
        butaca = funcion.get_butaca_by_id(butaca_id)
        if not butaca:
            raise HTTPException(status_code=404, detail=f"Butaca con ID {butaca_id} no encontrada.")
        if butaca.vendida: # HU4 [cite: 16]
            raise HTTPException(status_code=400, detail=f"La butaca F{butaca.fila}-N{butaca.numero} (ID: {butaca_id}) ya fue vendida.")

        precio_venta = butaca.calcular_precio_base() # HU4 [cite: 17]
        butaca.vendida = True
        butaca.precio_final_venta = precio_venta
        monto_total_venta_actual += precio_venta
        butacas_vendidas_info.append(butaca)
    
    funcion.dinero_recaudado_total += monto_total_venta_actual
    return butacas_vendidas_info