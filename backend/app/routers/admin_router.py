from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import timezone

from .. import crud, schemas, auth, models
from ..dependencies import get_db

router = APIRouter(
    prefix="/admin",
    tags=["Admin Panel"],
    dependencies=[Depends(auth.get_current_admin_user)]
)

# --- Endpoint del Dashboard ---
@router.get("/dashboard-stats", response_model=schemas.DashboardStatsSchema)
def get_stats_for_dashboard(db: Session = Depends(get_db)):
    """
    Endpoint para obtener las 4 estadísticas clave (Métricas de Rendimiento) para el dashboard principal. 
    """
    return crud.get_dashboard_stats(db)

# --- Gestión de Funciones ---
@router.post("/funciones", response_model=schemas.FuncionResponseSchema, status_code=status.HTTP_201_CREATED)
def create_funcion(funcion_in: schemas.FuncionCreateSchema, db: Session = Depends(get_db)):
    """
    Crea una nueva función en la base de datos.
    """
    return crud.create_db_funcion(db=db, funcion=funcion_in)

@router.get("/funciones", response_model=List[schemas.FuncionListItemSchema])
def read_funciones(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    [OPTIMIZADO] Lee una lista de funciones usando una consulta optimizada
    para evitar el problema de N+1 y mejorar el rendimiento.
    """
    results = crud.get_all_funciones_with_counts(db=db, skip=skip, limit=limit)
    response_list = [
        schemas.FuncionListItemSchema(
            id=funcion.id,
            nombre_obra=funcion.nombre_obra,
            fecha_hora=funcion.fecha_hora,
            cantidad_butacas=cant_butacas,
            cantidad_butacas_vendidas=cant_vendidas,
            activa=funcion.activa
        ) for funcion, cant_butacas, cant_vendidas in results
    ]
    return response_list

@router.get("/funciones/{funcion_id}", response_model=schemas.FuncionResponseSchema)
def read_funcion(funcion_id: str, db: Session = Depends(get_db)):
    """
    Obtiene los detalles completos de una función específica por su ID.
    """
    db_funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if db_funcion is None:
        raise HTTPException(status_code=404, detail="Función no encontrada")
    return db_funcion

@router.put("/funciones/{funcion_id}", response_model=schemas.FuncionResponseSchema)
def update_funcion(funcion_id: str, funcion_in: schemas.FuncionUpdateSchema, db: Session = Depends(get_db)):
    """
    Actualiza una función existente, cumpliendo con la HU2. 
    """
    db_funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if db_funcion is None:
        raise HTTPException(status_code=404, detail="Función no encontrada para actualizar")
    
    update_data = funcion_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_funcion, key, value)
    
    db.add(db_funcion)
    db.commit()
    db.refresh(db_funcion)
    return db_funcion

@router.delete("/funciones/{funcion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_funcion(funcion_id: str, db: Session = Depends(get_db)):
    """
    Elimina una función de la base de datos, cumpliendo con la HU3. 
    """
    db_funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if db_funcion is None:
        raise HTTPException(status_code=404, detail="Función no encontrada para eliminar")
    
    db.delete(db_funcion)
    db.commit()
    return

# --- Gestión de Butacas ---
@router.put("/funciones/{funcion_id}/layout_butacas", response_model=List[schemas.ButacaResponseSchemaUnion])
def set_butacas_layout(funcion_id: str, layout_data: schemas.ButacaLayoutUpdateSchema, db: Session = Depends(get_db)):
    """
    Establece la disposición completa de butacas para una función desde la grilla.
    Cumple con la lógica de registro de butacas de la HU1. 
    """
    db_funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if not db_funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")
    
    return crud.update_butacas_layout(db=db, funcion_id=funcion_id, butacas_layout=layout_data)

@router.get("/funciones/{funcion_id}/butacas", response_model=List[schemas.ButacaResponseSchemaUnion])
def list_butacas_in_funcion(funcion_id: str, db: Session = Depends(get_db)):
    """
    Lista todas las butacas habilitadas para una función específica.
    """
    db_funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if not db_funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")
    return db_funcion.butacas

# --- Reportes ---

@router.get("/reportes/resumen_ventas_tipo", response_model=schemas.ReporteResumenVentas)
def reporte_resumen_ventas_por_tipo(funcion_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Genera un Resumen de Ventas por Tipo de Butaca (HU12). 
    """
    return crud.get_reporte_resumen_ventas(db, funcion_id)

@router.get("/reportes/analisis_ocupacion", response_model=schemas.ReporteAnalisisOcupacionSchema)
def reporte_analisis_ocupacion(funcion_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Genera un reporte de Análisis de Ocupación, comparando Platea y Balcón (HU9 Modificado). 
    """
    return crud.get_reporte_analisis_ocupacion(db, funcion_id)

@router.get("/reportes/comparar_protocolo_fumadores", response_model=schemas.ReporteComparacionProtocoloFumadores)
def reporte_protocolo_vs_fumadores(funcion_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Genera un reporte para Comparar Ventas de Protocolo vs. Fumadores (HU6). 
    """
    return crud.get_reporte_comparacion_protocolo_fumadores(db, funcion_id)

@router.get("/reportes/todas_butacas_vendidas", response_model=List[schemas.ButacaResponseSchemaUnion])
def reporte_todas_las_butacas_vendidas(funcion_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Lista TODAS las butacas que han sido vendidas (Platea y Balcón).
    Esta es la versión modificada de la HU8. 
    """
    query = db.query(models.Butaca).filter(models.Butaca.vendida == True)
    if funcion_id:
        query = query.filter(models.Butaca.funcion_id == funcion_id)
    return query.order_by(models.Butaca.fila, models.Butaca.numero).all()

@router.get("/reportes/dinero_recaudado_supera", response_model=schemas.ReporteDineroSuperaValor)
def reporte_dinero_supera(valor: float = Query(..., gt=0), funcion_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Verifica si los ingresos totales superan un valor específico.
    """
    query = db.query(func.sum(models.Funcion.dinero_recaudado_total))
    if funcion_id:
        query = query.filter(models.Funcion.id == funcion_id)
    
    total_recaudado = query.scalar() or 0.0
    
    return schemas.ReporteDineroSuperaValor(
        supera_valor=total_recaudado > valor,
        total_recaudado=total_recaudado,
        valor_comparacion=valor
    )