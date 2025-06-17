from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, status
import uuid
from . import models, schemas, auth

# --- Funciones de Usuario ---
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_initial_users(db: Session):
    # Solo crear si no existen
    if not get_user_by_username(db, "admin"):
        hashed_password_admin = auth.get_password_hash("adminpass")
        admin_user = models.User(username="admin", hashed_password=hashed_password_admin, rol="admin")
        db.add(admin_user)
        print("Usuario 'admin' creado.")
    
    if not get_user_by_username(db, "cliente1"):
        hashed_password_client = auth.get_password_hash("clientpass")
        client_user = models.User(username="cliente1", hashed_password=hashed_password_client, rol="cliente")
        db.add(client_user)
        print("Usuario 'cliente1' creado.")
        
    db.commit()

# --- Funciones de "Funcion" ---
def get_funcion_by_id(db: Session, funcion_id: str):
    return db.query(models.Funcion).filter(models.Funcion.id == funcion_id).first()

def get_all_funciones(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Funcion).offset(skip).limit(limit).all()

def get_active_funciones(db: Session, limit: int = 10):
    return db.query(models.Funcion).filter(models.Funcion.activa == True).order_by(models.Funcion.fecha_hora.desc()).limit(limit).all()

def create_db_funcion(db: Session, funcion: schemas.FuncionCreateSchema):
    active_funciones_count = db.query(models.Funcion).filter(models.Funcion.activa == True).count()
    if active_funciones_count >= 10:
        raise HTTPException(status_code=400, detail="Límite de 10 funciones activas alcanzado.")
        
    db_funcion = models.Funcion(
        id=str(uuid.uuid4()),
        nombre_obra=funcion.nombre_obra,
        fecha_hora=funcion.fecha_hora
    )
    db.add(db_funcion)
    db.commit()
    db.refresh(db_funcion)
    return db_funcion

# --- Funciones de "Butaca" ---
def add_butaca_to_funcion(db: Session, funcion_id: str, butaca_data: schemas.ButacaCreateSchemaUnion):
    # Validar que no exista
    existing = db.query(models.Butaca).filter(
        models.Butaca.funcion_id == funcion_id,
        models.Butaca.fila == butaca_data.fila,
        models.Butaca.numero == butaca_data.numero
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Butaca F{butaca_data.fila}-N{butaca_data.numero} ya existe.")
    
    db_butaca = models.Butaca(id=str(uuid.uuid4()), funcion_id=funcion_id, **butaca_data.model_dump())
    db.add(db_butaca)
    db.commit()
    db.refresh(db_butaca)
    return db_butaca

def vender_butacas_funcion(db: Session, funcion_id: str, ids_butacas_a_vender: List[str], username_comprador: str):
    funcion = get_funcion_by_id(db, funcion_id)
    if not funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    butacas_a_actualizar = db.query(models.Butaca).filter(
        models.Butaca.funcion_id == funcion_id,
        models.Butaca.id.in_(ids_butacas_a_vender)
    ).all()

    if len(butacas_a_actualizar) != len(ids_butacas_a_vender):
        raise HTTPException(status_code=404, detail="Una o más butacas no fueron encontradas.")
        
    monto_total_venta_actual = 0.0
    for butaca in butacas_a_actualizar:
        if butaca.vendida:
            raise ValueError(f"La butaca F{butaca.fila}-N{butaca.numero} ya fue vendida.")
        
        precio_venta = butaca.calcular_precio_base()
        butaca.vendida = True
        butaca.precio_final_venta = precio_venta
        butaca.comprador_username = username_comprador # Guardamos quién la compró
        monto_total_venta_actual += precio_venta

    funcion.dinero_recaudado_total += monto_total_venta_actual
    db.commit()
    return butacas_a_actualizar