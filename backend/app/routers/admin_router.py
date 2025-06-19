from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import func, case

# Se importan los módulos necesarios de la aplicación
from .. import crud, schemas, auth, models
from ..dependencies import get_db

# Se crea el router con un prefijo, tags y una dependencia que protege todas las rutas
# asegurando que solo los usuarios con rol de 'admin' puedan acceder.
router = APIRouter(
    prefix="/admin",
    tags=["Admin Panel"],
    dependencies=[Depends(auth.get_current_admin_user)]
)

# --- Gestión de Funciones ---

@router.post("/funciones", response_model=schemas.FuncionResponseSchema, status_code=status.HTTP_201_CREATED)
def create_funcion(
    funcion_in: schemas.FuncionCreateSchema,
    db: Session = Depends(get_db)
):
    """
    Crea una nueva función en la base de datos.
    """
    return crud.create_db_funcion(db=db, funcion=funcion_in)

@router.get("/funciones", response_model=List[schemas.FuncionListItemSchema])
def read_funciones(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    solo_activas: bool = Query(False, description="Filtrar solo funciones activas")
):
   # Se llama a la nueva función optimizada del CRUD
    results = crud.get_all_funciones_with_counts(db=db, skip=skip, limit=limit)

    # Se construye la respuesta sin necesidad de más consultas
    response_list = []
    for funcion, cant_butacas, cant_vendidas in results:
        response_list.append(schemas.FuncionListItemSchema(
            id=funcion.id,
            nombre_obra=funcion.nombre_obra,
            fecha_hora=funcion.fecha_hora,
            cantidad_butacas=cant_butacas,
            cantidad_butacas_vendidas=cant_vendidas,
            activa=funcion.activa
        ))
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
def update_funcion(
    funcion_id: str, 
    funcion_in: schemas.FuncionUpdateSchema, 
    db: Session = Depends(get_db)
):
    """
    Actualiza los datos de una función existente.
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
    Elimina una función y sus butacas asociadas (por la configuración de 'cascade') de la base de datos.
    """
    db_funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if db_funcion is None:
        raise HTTPException(status_code=404, detail="Función no encontrada para eliminar")
    
    db.delete(db_funcion)
    db.commit()
    return

# --- Gestión de Butacas en una Función ---

@router.post("/funciones/{funcion_id}/butacas", response_model=schemas.ButacaResponseSchemaUnion, status_code=status.HTTP_201_CREATED)
def create_butaca_for_funcion(
    funcion_id: str, 
    butaca_in: schemas.ButacaCreateSchemaUnion,
    db: Session = Depends(get_db)
):
    """
    Añade una nueva butaca a una función existente.
    """
    db_funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if not db_funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada para añadir butaca")
    
    return crud.add_butaca_to_funcion(db=db, funcion_id=funcion_id, butaca_data=butaca_in)

@router.get("/funciones/{funcion_id}/butacas", response_model=List[schemas.ButacaResponseSchemaUnion])
def list_butacas_in_funcion(funcion_id: str, db: Session = Depends(get_db)):
    """
    Lista todas las butacas asociadas a una función específica.
    """
    db_funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if not db_funcion:
        raise HTTPException(status_code=404, detail="Función no encontrada")
    return db_funcion.butacas

# --- ENDPOINTS FALTANTES AÑADIDOS ---

def get_butaca_or_404(db: Session, funcion_id: str, butaca_id: str):
    """Función auxiliar para obtener una butaca o lanzar un error 404."""
    butaca = db.query(models.Butaca).filter(models.Butaca.id == butaca_id, models.Butaca.funcion_id == funcion_id).first()
    if not butaca:
        raise HTTPException(status_code=404, detail="Butaca no encontrada en esta función")
    return butaca

@router.put("/funciones/{funcion_id}/butacas/{butaca_id}", response_model=schemas.ButacaResponseSchemaUnion)
def update_butaca_in_funcion(
    funcion_id: str,
    butaca_id: str,
    butaca_in: schemas.ButacaUpdateSchema,
    db: Session = Depends(get_db)
):
    """
    Actualiza una butaca específica dentro de una función.
    """
    db_butaca = get_butaca_or_404(db, funcion_id, butaca_id)

    update_data = butaca_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_butaca, key, value)
    
    db.add(db_butaca)
    db.commit()
    db.refresh(db_butaca)
    return db_butaca

@router.delete("/funciones/{funcion_id}/butacas/{butaca_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_butaca_from_funcion(
    funcion_id: str,
    butaca_id: str,
    db: Session = Depends(get_db)
):
    """
    Elimina una butaca específica de una función.
    """
    db_butaca = get_butaca_or_404(db, funcion_id, butaca_id)
    if db_butaca.vendida:
        raise HTTPException(status_code=400, detail="No se puede eliminar una butaca que ya ha sido vendida.")
    
    db.delete(db_butaca)
    db.commit()
    return

@router.get("/funciones/{funcion_id}/butacas/buscar", response_model=schemas.ButacaResponseSchemaUnion)
def search_butaca_in_funcion(
    funcion_id: str,
    fila: int = Query(..., gt=0),
    numero: int = Query(..., gt=0),
    db: Session = Depends(get_db)
):
    """
    Busca una butaca por su fila y número dentro de una función específica.
    """
    butaca = db.query(models.Butaca).filter(
        models.Butaca.funcion_id == funcion_id,
        models.Butaca.fila == fila,
        models.Butaca.numero == numero
    ).first()
    if not butaca:
        raise HTTPException(status_code=404, detail=f"Butaca F{fila}-N{numero} no encontrada en esta función.")
    return butaca

# --- Reportes ---

@router.get("/reportes/dinero_recaudado_supera", response_model=schemas.ReporteDineroSuperaValor)
def reporte_dinero_supera(
    valor: float = Query(..., gt=0),
    funcion_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Verifica si el dinero recaudado supera un valor dado, de forma global o para una función.
    """
    total_recaudado = 0.0
    if funcion_id:
        funcion = crud.get_funcion_by_id(db, funcion_id=funcion_id)
        if not funcion:
            raise HTTPException(status_code=404, detail="Función no encontrada")
        total_recaudado = funcion.dinero_recaudado_total
    else: 
        result = db.query(func.sum(models.Funcion.dinero_recaudado_total)).scalar()
        total_recaudado = result or 0.0
    
    return schemas.ReporteDineroSuperaValor(
        supera_valor=total_recaudado > valor,
        total_recaudado=total_recaudado,
        valor_comparacion=valor
    )

@router.get("/reportes/comparar_protocolo_fumadores", response_model=schemas.ReporteComparacionProtocoloFumadores)
def reporte_protocolo_vs_fumadores(
    funcion_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Compara la cantidad de butacas de protocolo vendidas vs. las de fumadores vendidas.
    """
    query_base = db.query(models.Butaca).filter(models.Butaca.vendida == True)
    if funcion_id:
        query_base = query_base.filter(models.Butaca.funcion_id == funcion_id)

    # Las consultas se hacen por separado para no interferir una con la otra.
    protocolo_vendidas = query_base.filter(models.Butaca.es_protocolo == True).count()
    fumadores_vendidas = db.query(models.Butaca).filter(
        models.Butaca.vendida == True, 
        models.Butaca.es_fumadores == True,
        models.Butaca.funcion_id == (funcion_id if funcion_id else models.Butaca.funcion_id)
    ).count()
    
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

@router.get("/reportes/total_dinero_protocolo", response_model=schemas.ReporteTotalDineroProtocolo)
def reporte_total_dinero_protocolo(
    funcion_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Calcula el total de dinero recaudado solo por butacas de protocolo.
    """
    query = db.query(func.sum(models.Butaca.precio_final_venta)).filter(
        models.Butaca.vendida == True,
        models.Butaca.es_protocolo == True
    )
    if funcion_id:
        query = query.filter(models.Butaca.funcion_id == funcion_id)
    
    total_recaudado_protocolo = query.scalar() or 0.0
    
    return schemas.ReporteTotalDineroProtocolo(total_recaudado_protocolo=total_recaudado_protocolo)

@router.get("/reportes/balcon_vendidas", response_model=List[schemas.ButacaResponseSchemaUnion])
def reporte_balcon_vendidas(
    funcion_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Lista todas las butacas de balcón que han sido vendidas.
    """
    query = db.query(models.Butaca).filter(
        models.Butaca.vendida == True,
        models.Butaca.tipo_butaca == 'balcon'
    )
    if funcion_id:
        query = query.filter(models.Butaca.funcion_id == funcion_id)
        
    return query.all()

@router.get("/reportes/porcentaje_platea_vendidas", response_model=schemas.ReportePorcentajePlateaVendidas)
def reporte_porcentaje_platea(
    funcion_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Calcula qué porcentaje de las butacas de platea disponibles han sido vendidas.
    """
    query = db.query(models.Butaca).filter(models.Butaca.tipo_butaca == 'platea')
    if funcion_id:
        query = query.filter(models.Butaca.funcion_id == funcion_id)
        
    total_platea = query.count()
    platea_vendidas = query.filter(models.Butaca.vendida == True).count()
    
    porcentaje = (platea_vendidas / total_platea * 100) if total_platea > 0 else 0.0
    
    return schemas.ReportePorcentajePlateaVendidas(
        porcentaje_platea_vendidas=round(porcentaje, 2),
        total_platea=total_platea,
        platea_vendidas=platea_vendidas
    )

@router.get("/reportes/resumen_ventas_tipo", response_model=schemas.ReporteResumenVentas)
def reporte_resumen_ventas_por_tipo(
    funcion_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # La base de la consulta para butacas vendidas
    query = db.query(
        # Se usa 'case' para crear etiquetas dinámicas para agrupar
        case(
            (models.Butaca.es_protocolo == True, "Platea Protocolo"),
            (models.Butaca.tipo_butaca == 'platea', "Platea Normal"),
            (models.Butaca.es_fumadores == True, "Balcón Fumadores"),
            (models.Butaca.tipo_butaca == 'balcon', "Balcón No Fumadores"),
            else_="Otro"
        ).label("tipo"),
        func.count(models.Butaca.id).label("cantidad_vendida"),
        func.sum(models.Butaca.precio_final_venta).label("dinero_recaudado")
    ).filter(models.Butaca.vendida == True)

    if funcion_id:
        query = query.filter(models.Butaca.funcion_id == funcion_id)

    # Se agrupa directamente en la base de datos
    results = query.group_by("tipo").all()

    total_query = db.query(
        func.count(models.Butaca.id),
        func.sum(models.Butaca.precio_final_venta)
    ).filter(models.Butaca.vendida == True)
    if funcion_id:
        total_query = total_query.filter(models.Butaca.funcion_id == funcion_id)

    total_vendidas, total_dinero = total_query.first() or (0, 0.0)

    return schemas.ReporteResumenVentas(
        items=[schemas.VentasPorTipoButaca.model_validate(row) for row in results],
        total_general_vendidas=total_vendidas,
        dinero_total_recaudado_general=total_dinero or 0.0
    )