from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import func

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
    """
    Lee una lista de funciones desde la base de datos.
    Puede filtrar para mostrar solo las activas.
    """
    if solo_activas:
        db_funciones = crud.get_active_funciones(db=db, limit=limit)
    else:
        db_funciones = crud.get_all_funciones(db=db, skip=skip, limit=limit)

    response_list = []
    for f in db_funciones:
        vendidas_count = len([b for b in f.butacas if b.vendida])
        response_list.append(schemas.FuncionListItemSchema(
            id=f.id,
            nombre_obra=f.nombre_obra,
            fecha_hora=f.fecha_hora,
            cantidad_butacas=len(f.butacas),
            cantidad_butacas_vendidas=vendidas_count,
            activa=f.activa
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
    """
    Genera un resumen de ventas agrupado por subtipos de butaca.
    """
    query = db.query(models.Butaca).filter(models.Butaca.vendida == True)
    if funcion_id:
        query = query.filter(models.Butaca.funcion_id == funcion_id)
    
    butacas_vendidas = query.all()
    
    resumen = {
        "platea_protocolo": {"cantidad": 0, "dinero": 0.0},
        "platea_normal": {"cantidad": 0, "dinero": 0.0},
        "balcon_fumadores": {"cantidad": 0, "dinero": 0.0},
        "balcon_no_fumadores": {"cantidad": 0, "dinero": 0.0},
    }
    
    for butaca in butacas_vendidas:
        precio = butaca.precio_final_venta or 0.0
        if butaca.tipo_butaca == 'platea':
            if butaca.es_protocolo:
                resumen["platea_protocolo"]["cantidad"] += 1
                resumen["platea_protocolo"]["dinero"] += precio
            else:
                resumen["platea_normal"]["cantidad"] += 1
                resumen["platea_normal"]["dinero"] += precio
        elif butaca.tipo_butaca == 'balcon':
            if butaca.es_fumadores:
                resumen["balcon_fumadores"]["cantidad"] += 1
                resumen["balcon_fumadores"]["dinero"] += precio
            else:
                resumen["balcon_no_fumadores"]["cantidad"] += 1
                resumen["balcon_no_fumadores"]["dinero"] += precio

    items_list = [
        schemas.VentasPorTipoButaca(tipo="Platea Protocolo", cantidad_vendida=resumen["platea_protocolo"]["cantidad"], dinero_recaudado=resumen["platea_protocolo"]["dinero"]),
        schemas.VentasPorTipoButaca(tipo="Platea Normal", cantidad_vendida=resumen["platea_normal"]["cantidad"], dinero_recaudado=resumen["platea_normal"]["dinero"]),
        schemas.VentasPorTipoButaca(tipo="Balcón Fumadores", cantidad_vendida=resumen["balcon_fumadores"]["cantidad"], dinero_recaudado=resumen["balcon_fumadores"]["dinero"]),
        schemas.VentasPorTipoButaca(tipo="Balcón No Fumadores", cantidad_vendida=resumen["balcon_no_fumadores"]["cantidad"], dinero_recaudado=resumen["balcon_no_fumadores"]["dinero"]),
    ]

    return schemas.ReporteResumenVentas(
        items=items_list,
        total_general_vendidas=len(butacas_vendidas),
        dinero_total_recaudado_general=sum(b.precio_final_venta or 0.0 for b in butacas_vendidas)
    )