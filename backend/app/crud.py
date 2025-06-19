from sqlalchemy.orm import Session, subqueryload
from sqlalchemy import func
from typing import List, Optional
from fastapi import HTTPException, status
import uuid
from . import models, schemas, auth

# --- Funciones de Usuario ---

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """
    Obtiene un usuario de la base de datos por su nombre de usuario.
    """
    return db.query(models.User).filter(models.User.username == username).first()

def create_initial_users(db: Session):
    """
    Crea los usuarios iniciales ('admin' y 'cliente1') si no existen.
    Esta función se llama al iniciar la aplicación.
    """
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

def get_funcion_by_id(db: Session, funcion_id: str) -> Optional[models.Funcion]:
    """
    Obtiene una función de la base de datos por su ID.
    """
    return db.query(models.Funcion).filter(models.Funcion.id == funcion_id).first()

def get_all_funciones(db: Session, skip: int = 0, limit: int = 100) -> List[models.Funcion]:
    """
    Obtiene una lista de todas las funciones (versión simple sin conteos optimizados).
    """
    return db.query(models.Funcion).order_by(models.Funcion.fecha_hora.desc()).offset(skip).limit(limit).all()

def get_all_funciones_with_counts(db: Session, skip: int = 0, limit: int = 100):
    """
    [OPTIMIZADO] Obtiene todas las funciones con los conteos de butacas precalculados
    en una sola consulta para evitar el problema N+1.
    """
    # Subconsulta para contar el total de butacas por función
    total_butacas_sq = db.query(
        models.Butaca.funcion_id,
        func.count(models.Butaca.id).label("total_butacas")
    ).group_by(models.Butaca.funcion_id).subquery()

    # Subconsulta para contar butacas vendidas por función
    vendidas_sq = db.query(
        models.Butaca.funcion_id,
        func.count(models.Butaca.id).label("vendidas_butacas")
    ).filter(models.Butaca.vendida == True).group_by(models.Butaca.funcion_id).subquery()

    # Consulta principal que une todo
    query = db.query(
        models.Funcion,
        func.coalesce(total_butacas_sq.c.total_butacas, 0).label("cantidad_butacas"),
        func.coalesce(vendidas_sq.c.vendidas_butacas, 0).label("cantidad_butacas_vendidas")
    ).outerjoin(total_butacas_sq, models.Funcion.id == total_butacas_sq.c.funcion_id)\
     .outerjoin(vendidas_sq, models.Funcion.id == vendidas_sq.c.funcion_id)\
     .order_by(models.Funcion.fecha_hora.desc())\
     .offset(skip).limit(limit)
    
    return query.all()


def get_active_funciones(db: Session, limit: int = 10) -> List[models.Funcion]:
    """
    Obtiene una lista de las funciones activas (versión simple), ordenadas por fecha más reciente.
    """
    return db.query(models.Funcion).filter(models.Funcion.activa == True).order_by(models.Funcion.fecha_hora.desc()).limit(limit).all()

def create_db_funcion(db: Session, funcion: schemas.FuncionCreateSchema) -> models.Funcion:
    """
    Crea una nueva función en la base de datos, validando el límite de funciones activas.
    """
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

def add_butaca_to_funcion(db: Session, funcion_id: str, butaca_data: schemas.ButacaCreateSchemaUnion) -> models.Butaca:
    """
    Añade una nueva butaca a una función, validando que no haya duplicados por posición.
    """
    existing_butaca = db.query(models.Butaca).filter(
        models.Butaca.funcion_id == funcion_id,
        models.Butaca.fila == butaca_data.fila,
        models.Butaca.numero == butaca_data.numero
    ).first()
    if existing_butaca:
        raise HTTPException(status_code=400, detail=f"La posición Fila {butaca_data.fila}-Número {butaca_data.numero} ya está ocupada en esta función.")
    
    # Crea la nueva butaca usando los datos del schema
    db_butaca = models.Butaca(id=str(uuid.uuid4()), funcion_id=funcion_id, **butaca_data.model_dump())
    db.add(db_butaca)
    db.commit()
    db.refresh(db_butaca)
    return db_butaca

def vender_butacas_funcion(db: Session, funcion_id: str, ids_butacas_a_vender: List[str], username_comprador: str) -> List[models.Butaca]:
    """
    Marca una lista de butacas como vendidas, asigna el comprador y actualiza el total recaudado.
    Implementa un bloqueo de base de datos para prevenir condiciones de carrera (race conditions).
    """
    funcion = get_funcion_by_id(db, funcion_id)
    if not funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    # Bloquea las filas de las butacas seleccionadas para la actualización.
    butacas_a_actualizar = db.query(models.Butaca).filter(
        models.Butaca.funcion_id == funcion_id,
        models.Butaca.id.in_(ids_butacas_a_vender)
    ).with_for_update().all()

    if len(butacas_a_actualizar) != len(ids_butacas_a_vender):
        raise HTTPException(status_code=404, detail="Una o más butacas no fueron encontradas.")
        
    monto_total_venta_actual = 0.0
    for butaca in butacas_a_actualizar:
        if butaca.vendida:
            raise ValueError(f"La butaca F{butaca.fila}-N{butaca.numero} ya fue vendida.")
        
        precio_venta = butaca.calcular_precio_base()
        butaca.vendida = True
        butaca.precio_final_venta = precio_venta
        butaca.comprador_username = username_comprador
        monto_total_venta_actual += precio_venta

    if funcion.dinero_recaudado_total is None:
        funcion.dinero_recaudado_total = 0.0
    funcion.dinero_recaudado_total += monto_total_venta_actual
    
    db.commit()
    
    for butaca in butacas_a_actualizar:
        db.refresh(butaca)
        
    return butacas_a_actualizar