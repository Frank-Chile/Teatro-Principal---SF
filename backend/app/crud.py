# backend/app/crud.py
from sqlalchemy.orm import Session, subqueryload
from sqlalchemy import func, case
from typing import List, Optional
from fastapi import HTTPException, status
import uuid
from datetime import datetime, timezone
import pytz

from . import models, schemas, auth

# --- Funciones de Usuario ---

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Obtiene un usuario por su nombre de usuario."""
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Obtiene un usuario por su email."""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreateSchema) -> models.User:
    """Crea un nuevo usuario con la contraseña hasheada y rol 'cliente'."""
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        nombres_apellidos=user.nombres_apellidos,
        hashed_password=hashed_password,
        rol="cliente"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_initial_users(db: Session):
    """Crea los usuarios 'admin' y 'cliente1' al iniciar la app si no existen."""
    if not get_user_by_username(db, "admin"):
        admin_data = schemas.UserCreateSchema(
            username="admin", email="admin@teatro.com",
            nombres_apellidos="Administrador del Sistema", password="adminpass"
        )
        admin_user = create_user(db, admin_data)
        admin_user.rol = "admin"
        db.commit()
        db.refresh(admin_user)
    
    if not get_user_by_username(db, "cliente1"):
        client_data = schemas.UserCreateSchema(
            username="cliente1", email="cliente1@teatro.com",
            nombres_apellidos="Cliente Uno", password="clientpass"
        )
        create_user(db, client_data)

def get_funciones_con_entradas_por_usuario(db: Session, user_id: int) -> List[models.Funcion]:
    """
    Obtiene una lista de funciones únicas para las cuales un usuario específico ha comprado al menos una butaca.
    """
    subquery = db.query(models.Butaca.funcion_id).filter(
        models.Butaca.comprador_id == user_id,
        models.Butaca.vendida == True
    ).distinct()

    return db.query(models.Funcion).filter(models.Funcion.id.in_(subquery)).order_by(models.Funcion.fecha_hora.desc()).all()

# --- Funciones de "Funcion" ---

def get_funcion_by_id(db: Session, funcion_id: str) -> Optional[models.Funcion]:
    """Obtiene una función específica por su ID."""
    db_funcion = db.query(models.Funcion).filter(models.Funcion.id == funcion_id).first()
    return db_funcion

def get_all_funciones_with_counts(db: Session, skip: int = 0, limit: int = 100):
    """
    [OPTIMIZADO] Obtiene funciones con conteos de butacas precalculados en una
    sola consulta para evitar el problema N+1 y mejorar el rendimiento.
    """
    total_butacas_sq = db.query(
        models.Butaca.funcion_id,
        func.count(models.Butaca.id).label("total_butacas")
    ).group_by(models.Butaca.funcion_id).subquery()

    vendidas_sq = db.query(
        models.Butaca.funcion_id,
        func.count(models.Butaca.id).label("vendidas_butacas")
    ).filter(models.Butaca.vendida == True).group_by(models.Butaca.funcion_id).subquery()

    query = db.query(
        models.Funcion,
        func.coalesce(total_butacas_sq.c.total_butacas, 0).label("cantidad_butacas"),
        func.coalesce(vendidas_sq.c.vendidas_butacas, 0).label("cantidad_butacas_vendidas")
    ).outerjoin(total_butacas_sq, models.Funcion.id == total_butacas_sq.c.funcion_id)\
     .outerjoin(vendidas_sq, models.Funcion.id == vendidas_sq.c.funcion_id)\
     .order_by(models.Funcion.fecha_hora.desc()).offset(skip).limit(limit)
    
    return query.all()

def get_active_funciones(db: Session, limit: int = 10) -> List[models.Funcion]:
    """Obtiene una lista de las funciones activas para la vista del cliente."""
    return db.query(models.Funcion).filter(models.Funcion.activa == True).order_by(models.Funcion.fecha_hora.desc()).limit(limit).all()

def create_db_funcion(db: Session, funcion: schemas.FuncionCreateSchema) -> models.Funcion:
    """
    [CORREGIDO] Crea una nueva función, manejando correctamente la zona horaria.
    """
    active_funciones_count = db.query(models.Funcion).filter(models.Funcion.activa == True).count()
    if active_funciones_count >= 10:
        raise HTTPException(status_code=400, detail="Límite de 10 funciones activas alcanzado.")
    
    dt = funcion.fecha_hora
    
    peru_tz = pytz.timezone("America/Lima")

    if dt.tzinfo is None:
        fecha_local_peru = peru_tz.localize(dt)
    else:
        fecha_local_peru = dt.astimezone(peru_tz)

    fecha_hora_utc = fecha_local_peru.astimezone(pytz.utc)

    if fecha_hora_utc < datetime.now(pytz.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede crear una función en una fecha u hora pasada."
        )
        
    db_funcion = models.Funcion(
        id=str(uuid.uuid4()),
        nombre_obra=funcion.nombre_obra,
        fecha_hora=fecha_hora_utc
    )
    db.add(db_funcion)
    db.commit()
    db.refresh(db_funcion)
    return db_funcion

def delete_db_funcion(db: Session, funcion_id: str) -> bool:
    """
    Elimina una función de forma segura. Primero verifica que no tenga
    butacas vendidas antes de proceder con la eliminación.
    """
    db_funcion = db.query(models.Funcion).options(subqueryload(models.Funcion.butacas)).filter(models.Funcion.id == funcion_id).first()
    
    if not db_funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")
        
    if any(butaca.vendida for butaca in db_funcion.butacas):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar una función que ya tiene entradas vendidas."
        )
        
    db.delete(db_funcion)
    db.commit()
    return True

# --- Funciones de "Butaca" ---

def update_butacas_layout(db: Session, funcion_id: str, butacas_layout: schemas.ButacaLayoutUpdateSchema) -> List[models.Butaca]:
    """
    Actualiza la disposición de butacas (HU1, HU2), protegiendo las ya vendidas (HU3).
    """
    butacas_actuales_db = db.query(models.Butaca).filter(models.Butaca.funcion_id == funcion_id).all()
    mapa_actual_db = {(b.fila, b.numero): b for b in butacas_actuales_db}
    
    butacas_nuevas_layout = butacas_layout.butacas
    mapa_nuevas_layout = {(b.fila, b.numero): b for b in butacas_nuevas_layout}

    for pos, butaca_db in mapa_actual_db.items():
        if pos not in mapa_nuevas_layout and not butaca_db.vendida:
            db.delete(butaca_db)

    for pos, butaca_data in mapa_nuevas_layout.items():
        butaca_existente = mapa_actual_db.get(pos)
        if butaca_existente:
            if not butaca_existente.vendida:
                butaca_existente.es_protocolo = butaca_data.es_protocolo
                butaca_existente.es_fumadores = butaca_data.es_fumadores
                butaca_existente.seccion = butaca_data.seccion
        else:
            nueva_butaca = models.Butaca(id=str(uuid.uuid4()), funcion_id=funcion_id, **butaca_data.model_dump())
            db.add(nueva_butaca)
            
    db.commit()
    return db.query(models.Butaca).filter(models.Butaca.funcion_id == funcion_id).order_by(models.Butaca.fila, models.Butaca.numero).all()

def vender_butacas_funcion(db: Session, funcion_id: str, ids_butacas_a_vender: List[str], comprador_id: int) -> List[models.Butaca]:
    """Marca butacas como vendidas (HU4). Usa un bloqueo para prevenir doble venta."""
    funcion = get_funcion_by_id(db, funcion_id)
    if not funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")
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
        butaca.comprador_id = comprador_id
        monto_total_venta_actual += precio_venta
    if funcion.dinero_recaudado_total is None:
        funcion.dinero_recaudado_total = 0.0
    funcion.dinero_recaudado_total += monto_total_venta_actual
    db.commit()
    return butacas_a_actualizar

def get_butacas_compradas_por_usuario(db: Session, funcion_id: str, user_id: int) -> List[models.Butaca]:
    """Obtiene las butacas que un usuario específico ha comprado para una función."""
    return db.query(models.Butaca).filter(
        models.Butaca.funcion_id == funcion_id,
        models.Butaca.comprador_id == user_id,
        models.Butaca.vendida == True
    ).order_by(models.Butaca.fila, models.Butaca.numero).all()


# --- FUNCIONES DE REPORTES Y DASHBOARD ---

def get_dashboard_stats(db: Session):
    """
    [PARA EL DASHBOARD] Calcula las 4 estadísticas clave para la página principal del admin.
    Permite una monitorización de las Métricas de Rendimiento del negocio. 
    """
    funciones_activas = db.query(models.Funcion).filter(models.Funcion.activa == True).count()
    butacas_vendidas_total = db.query(models.Butaca).filter(models.Butaca.vendida == True).count()
    ingresos_totales_query = db.query(func.sum(func.coalesce(models.Funcion.dinero_recaudado_total, 0))).scalar()
    total_butacas_habilitadas = db.query(models.Butaca).count()
    aforo_promedio = 0.0
    if total_butacas_habilitadas > 0:
        aforo_promedio = (butacas_vendidas_total / total_butacas_habilitadas) * 100
    return schemas.DashboardStatsSchema(
        funciones_activas=funciones_activas,
        butacas_vendidas_total=butacas_vendidas_total,
        ingresos_totales=(ingresos_totales_query or 0.0),
        aforo_promedio=round(aforo_promedio, 2)
    )

def get_reporte_analisis_ocupacion(db: Session, funcion_id: Optional[str] = None):
    """
    [REPORTE] Calcula un análisis de ocupación (HU9 Modificado).
    """
    query = db.query(models.Butaca)
    if funcion_id:
        query = query.filter(models.Butaca.funcion_id == funcion_id)

    total_butacas = query.count()
    total_vendidas = query.filter(models.Butaca.vendida == True).count()
    platea_query = query.filter(models.Butaca.tipo_butaca == 'platea')
    platea_total = platea_query.count()
    platea_vendidas = platea_query.filter(models.Butaca.vendida == True).count()
    balcon_query = query.filter(models.Butaca.tipo_butaca == 'balcon')
    balcon_total = balcon_query.count()
    balcon_vendidas = balcon_query.filter(models.Butaca.vendida == True).count()

    return schemas.ReporteAnalisisOcupacionSchema(
        porcentaje_ocupacion_general=round((total_vendidas / total_butacas * 100) if total_butacas > 0 else 0, 2),
        total_butacas=total_butacas,
        total_vendidas=total_vendidas,
        ocupacion_platea=schemas.OcupacionDetalleSchema(
            total=platea_total, vendidas=platea_vendidas,
            porcentaje=round((platea_vendidas / platea_total * 100) if platea_total > 0 else 0, 2)
        ),
        ocupacion_balcon=schemas.OcupacionDetalleSchema(
            total=balcon_total, vendidas=balcon_vendidas,
            porcentaje=round((balcon_vendidas / balcon_total * 100) if balcon_total > 0 else 0, 2)
        )
    )

def get_reporte_resumen_ventas(db: Session, funcion_id: Optional[str] = None):
    """
    [REPORTE] Genera el Resumen de Ventas por Tipo (HU12).
    """
    query = db.query(
        case(
            (models.Butaca.es_protocolo == True, "Platea Protocolo"),
            (models.Butaca.tipo_butaca == 'platea', "Platea Normal"),
            (models.Butaca.es_fumadores == True, "Balcón Fumadores"),
            (models.Butaca.tipo_butaca == 'balcon', "Balcón No Fumadores"),
        ).label("tipo"),
        func.count(models.Butaca.id).label("cantidad_vendida"),
        func.sum(models.Butaca.precio_final_venta).label("dinero_recaudado")
    ).filter(models.Butaca.vendida == True)

    if funcion_id:
        query = query.filter(models.Butaca.funcion_id == funcion_id)
    
    results = query.group_by("tipo").all()
    
    total_query = db.query(func.count(models.Butaca.id), func.sum(models.Butaca.precio_final_venta)).filter(models.Butaca.vendida == True)
    if funcion_id:
        total_query = total_query.filter(models.Butaca.funcion_id == funcion_id)
    
    total_vendidas, total_dinero = total_query.first() or (0, 0.0)

    return schemas.ReporteResumenVentas(
        items=[schemas.VentasPorTipoButaca(**row._asdict()) for row in results],
        total_general_vendidas=total_vendidas or 0,
        dinero_total_recaudado_general=total_dinero or 0.0
    )

def get_reporte_comparacion_protocolo_fumadores(db: Session, funcion_id: Optional[str] = None):
    """
    [REPORTE] Compara ventas de Protocolo vs. Fumadores (HU6).
    """
    query_base = db.query(models.Butaca).filter(models.Butaca.vendida == True)
    if funcion_id:
        query_base = query_base.filter(models.Butaca.funcion_id == funcion_id)
    
    protocolo_vendidas = query_base.filter(models.Butaca.es_protocolo == True).count()
    
    fumadores_query_base = db.query(models.Butaca).filter(models.Butaca.vendida == True)
    if funcion_id:
        fumadores_query_base = fumadores_query_base.filter(models.Butaca.funcion_id == funcion_id)
    fumadores_vendidas = fumadores_query_base.filter(models.Butaca.es_fumadores == True).count()
    
    mensaje = "Se vendió la misma cantidad o ninguna."
    if protocolo_vendidas > fumadores_vendidas:
        mensaje = "Se vendieron más butacas de protocolo."
    elif fumadores_vendidas > protocolo_vendidas:
        mensaje = "Se vendieron más butacas de fumadores."

    return schemas.ReporteComparacionProtocoloFumadores(
        butacas_protocolo_vendidas=protocolo_vendidas,
        butacas_fumadores_vendidas=fumadores_vendidas,
        mensaje=mensaje
    )