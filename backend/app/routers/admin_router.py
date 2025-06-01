from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Union, Dict # Asegúrate que List y Union estén importados
from .. import crud, schemas, auth, models

router = APIRouter(
    prefix="/admin",
    tags=["Admin Panel"],
    dependencies=[Depends(auth.get_current_admin_user)]
)

# --- Gestión de Funciones ---
@router.post("/funciones", response_model=schemas.FuncionResponseSchema, status_code=status.HTTP_201_CREATED)
def create_funcion(
    funcion_in: schemas.FuncionCreateSchema,
    # current_user: schemas.UserSchema = Depends(auth.get_current_admin_user) # Ya protegido por router
):
    try:
        funcion = crud.create_db_funcion(funcion_in)
        return funcion # FastAPI serializará usando el response_model
    except HTTPException as e:
        raise e

@router.get("/funciones", response_model=List[schemas.FuncionListItemSchema])
def read_funciones(
    skip: int = 0, limit: int = 100,
    solo_activas: bool = Query(False, description="Filtrar solo funciones activas")
):
    if solo_activas:
        db_funciones = crud.get_active_funciones()
    else:
        db_funciones = crud.get_all_funciones()

    response_list = []
    for f in db_funciones[skip: skip + limit]:
        vendidas_count = sum(1 for b in f.butacas if b.vendida)
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
def read_funcion(funcion_id: str):
    db_funcion = crud.get_funcion_by_id(funcion_id)
    if db_funcion is None:
        raise HTTPException(status_code=404, detail="Función no encontrada")
    return db_funcion # FastAPI serializará

@router.put("/funciones/{funcion_id}", response_model=schemas.FuncionResponseSchema)
def update_funcion(funcion_id: str, funcion_in: schemas.FuncionUpdateSchema):
    try:
        updated_funcion = crud.update_db_funcion(funcion_id, funcion_in)
    except HTTPException as e:
        raise e
        
    if updated_funcion is None:
        raise HTTPException(status_code=404, detail="Función no encontrada para actualizar")
    return updated_funcion # FastAPI serializará

@router.delete("/funciones/{funcion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_funcion(funcion_id: str):
    if not crud.delete_db_funcion(funcion_id):
        raise HTTPException(status_code=404, detail="Función no encontrada para eliminar")
    return # No hay contenido para 204

# --- Gestión de Butacas en una Función ---
@router.post("/funciones/{funcion_id}/butacas", response_model=schemas.ButacaResponseSchemaUnion, status_code=status.HTTP_201_CREATED)
def create_butaca_for_funcion(
    funcion_id: str, 
    butaca_in: schemas.ButacaCreateSchemaUnion
):
    try:
        butaca_model_instance = crud.add_butaca_to_funcion(funcion_id, butaca_in)
        if butaca_model_instance is None:
            raise HTTPException(status_code=404, detail="Función no encontrada para añadir butaca")
        return butaca_model_instance # FastAPI serializará
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error in create_butaca_for_funcion: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor al crear la butaca.")

@router.get("/funciones/{funcion_id}/butacas", response_model=List[schemas.ButacaResponseSchemaUnion])
def list_butacas_in_funcion(funcion_id: str):
    print(f"--- Backend: Buscando función ID: {funcion_id} para listar butacas ---") # DEBUG
    funcion = crud.get_funcion_by_id(funcion_id)
    print(f"--- Backend: Función encontrada para listar butacas: {funcion is not None} ---") # DEBUG

    if not funcion:
        print(f"--- Backend: Función ID: {funcion_id} NO encontrada en DB (list_butacas). ---") # DEBUG
        raise HTTPException(status_code=404, detail="Función no encontrada")

    if not funcion.butacas:
        print(f"--- Backend: No hay butacas para la función {funcion_id} (list_butacas). ---") # DEBUG
        return []
    
    print(f"--- Backend: Retornando {len(funcion.butacas)} butacas para serialización (list_butacas). ---") #DEBUG
    # FastAPI se encargará de validar/serializar cada item de la lista funcion.butacas
    # usando el response_model List[schemas.ButacaResponseSchemaUnion]
    return funcion.butacas


@router.get("/funciones/{funcion_id}/butacas/buscar", response_model=schemas.ButacaResponseSchemaUnion)
def search_butaca_in_funcion(funcion_id: str, fila: int = Query(..., gt=0), numero: int = Query(..., gt=0)):
    butaca = crud.get_butaca_from_funcion_by_posicion(funcion_id, fila, numero)
    if not butaca:
        raise HTTPException(status_code=404, detail=f"Butaca F{fila}-N{numero} no encontrada en esta función.")
    return butaca # FastAPI serializará


@router.put("/funciones/{funcion_id}/butacas/{butaca_id}", response_model=schemas.ButacaResponseSchemaUnion)
def update_butaca_in_funcion_endpoint(funcion_id: str, butaca_id: str, butaca_in: schemas.ButacaUpdateSchema):
    try:
        updated_butaca = crud.update_butaca_in_funcion(funcion_id, butaca_id, butaca_in)
        if updated_butaca is None:
            raise HTTPException(status_code=404, detail="Butaca o función no encontrada")
        return updated_butaca # FastAPI serializará
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/funciones/{funcion_id}/butacas/{butaca_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_butaca_in_funcion_endpoint(funcion_id: str, butaca_id: str):
    try:
        if not crud.delete_butaca_from_funcion(funcion_id, butaca_id):
            raise HTTPException(status_code=404, detail="Butaca o función no encontrada")
    except HTTPException as e:
        raise e
    return # No hay contenido


# --- Reportes ---
# (Los endpoints de reportes no necesitaron cambios relacionados con model_validate,
# ya que retornan esquemas específicos directamente, no instancias de modelos de datos que necesitan conversión)

@router.get("/reportes/dinero_recaudado_supera", response_model=schemas.ReporteDineroSuperaValor)
def reporte_dinero_supera(
    valor: float = Query(..., gt=0),
    funcion_id: Optional[str] = Query(None, description="ID de la función específica, o global si no se provee")
):
    total_recaudado = 0
    if funcion_id:
        funcion = crud.get_funcion_by_id(funcion_id)
        if not funcion:
            raise HTTPException(status_code=404, detail="Función no encontrada")
        total_recaudado = funcion.dinero_recaudado_total
    else: 
        for f in crud.get_all_funciones():
            total_recaudado += f.dinero_recaudado_total
    
    return schemas.ReporteDineroSuperaValor(
        supera_valor=total_recaudado > valor,
        total_recaudado=total_recaudado,
        valor_comparacion=valor
    )

@router.get("/reportes/comparar_protocolo_fumadores", response_model=schemas.ReporteComparacionProtocoloFumadores)
def reporte_protocolo_vs_fumadores(
    funcion_id: Optional[str] = Query(None, description="ID de la función específica, o global si no se provee")
):
    protocolo_vendidas = 0
    fumadores_vendidas = 0
    
    funciones_a_revisar = [crud.get_funcion_by_id(funcion_id)] if funcion_id else crud.get_all_funciones()
    if funcion_id and not funciones_a_revisar[0]: # Chequea si se especificó un ID y la función no fue encontrada
        raise HTTPException(status_code=404, detail="Función no encontrada")

    for f in funciones_a_revisar:
        if not f: continue # Salta si la función es None (en caso de global y alguna función fue borrada de forma inesperada)
        for butaca in f.butacas:
            if butaca.vendida:
                if isinstance(butaca, models.Platea) and butaca.es_protocolo:
                    protocolo_vendidas += 1
                elif isinstance(butaca, models.Balcon) and butaca.es_fumadores:
                    fumadores_vendidas += 1
    
    mensaje = "Igual cantidad vendida."
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
    funcion_id: Optional[str] = Query(None)
):
    total_recaudado_protocolo = 0.0 # Asegurar que sea float
    funciones_a_revisar = [crud.get_funcion_by_id(funcion_id)] if funcion_id else crud.get_all_funciones()
    if funcion_id and not funciones_a_revisar[0]:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    for f in funciones_a_revisar:
        if not f: continue
        for butaca in f.butacas:
            # Asegurar que precio_final_venta no sea None antes de sumar
            if butaca.vendida and isinstance(butaca, models.Platea) and butaca.es_protocolo and butaca.precio_final_venta is not None:
                total_recaudado_protocolo += butaca.precio_final_venta
    
    return schemas.ReporteTotalDineroProtocolo(total_recaudado_protocolo=total_recaudado_protocolo)

@router.get("/reportes/balcon_vendidas", response_model=List[schemas.BalconResponseSchema])
def reporte_balcon_vendidas(
    funcion_id: Optional[str] = Query(None)
):
    butacas_balcon_vendidas_modelos = []
    funciones_a_revisar = [crud.get_funcion_by_id(funcion_id)] if funcion_id else crud.get_all_funciones()
    if funcion_id and not funciones_a_revisar[0]:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    for f in funciones_a_revisar:
        if not f: continue
        for butaca in f.butacas:
            if butaca.vendida and isinstance(butaca, models.Balcon):
                butacas_balcon_vendidas_modelos.append(butaca) # Añadir el modelo de datos
    # FastAPI serializará cada modelo a BalconResponseSchema
    return butacas_balcon_vendidas_modelos


@router.get("/reportes/porcentaje_platea_vendidas", response_model=schemas.ReportePorcentajePlateaVendidas)
def reporte_porcentaje_platea(
    funcion_id: Optional[str] = Query(None)
):
    total_platea = 0
    platea_vendidas = 0
    funciones_a_revisar = [crud.get_funcion_by_id(funcion_id)] if funcion_id else crud.get_all_funciones()
    if funcion_id and not funciones_a_revisar[0]:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    for f in funciones_a_revisar:
        if not f: continue
        for butaca in f.butacas:
            if isinstance(butaca, models.Platea):
                total_platea += 1
                if butaca.vendida:
                    platea_vendidas += 1
    
    porcentaje = (platea_vendidas / total_platea * 100) if total_platea > 0 else 0.0
    return schemas.ReportePorcentajePlateaVendidas(
        porcentaje_platea_vendidas=round(porcentaje, 2),
        total_platea=total_platea,
        platea_vendidas=platea_vendidas
    )

@router.get("/reportes/resumen_ventas_tipo", response_model=schemas.ReporteResumenVentas)
def reporte_resumen_ventas_por_tipo(
    funcion_id: Optional[str] = Query(None)
):
    resumen: Dict[str, Dict[str, Union[int, float]]] = {
        "platea_protocolo": {"cantidad": 0, "dinero": 0.0},
        "platea_normal": {"cantidad": 0, "dinero": 0.0},
        "balcon_fumadores": {"cantidad": 0, "dinero": 0.0},
        "balcon_no_fumadores": {"cantidad": 0, "dinero": 0.0},
    }
    total_vendidas_general = 0
    dinero_total_recaudado_general = 0.0

    funciones_a_revisar = [crud.get_funcion_by_id(funcion_id)] if funcion_id else crud.get_all_funciones()
    if funcion_id and not funciones_a_revisar[0]:
        raise HTTPException(status_code=404, detail="Función no encontrada")

    for f_obj in funciones_a_revisar:
        if not f_obj: continue
        for butaca in f_obj.butacas:
            if butaca.vendida and butaca.precio_final_venta is not None:
                total_vendidas_general += 1
                dinero_total_recaudado_general += butaca.precio_final_venta

                if isinstance(butaca, models.Platea):
                    if butaca.es_protocolo:
                        resumen["platea_protocolo"]["cantidad"] = int(resumen["platea_protocolo"]["cantidad"]) + 1
                        resumen["platea_protocolo"]["dinero"] = float(resumen["platea_protocolo"]["dinero"]) + butaca.precio_final_venta
                    else:
                        resumen["platea_normal"]["cantidad"] = int(resumen["platea_normal"]["cantidad"]) + 1
                        resumen["platea_normal"]["dinero"] = float(resumen["platea_normal"]["dinero"]) + butaca.precio_final_venta
                elif isinstance(butaca, models.Balcon):
                    if butaca.es_fumadores:
                        resumen["balcon_fumadores"]["cantidad"] = int(resumen["balcon_fumadores"]["cantidad"]) + 1
                        resumen["balcon_fumadores"]["dinero"] = float(resumen["balcon_fumadores"]["dinero"]) + butaca.precio_final_venta
                    else:
                        resumen["balcon_no_fumadores"]["cantidad"] = int(resumen["balcon_no_fumadores"]["cantidad"]) + 1
                        resumen["balcon_no_fumadores"]["dinero"] = float(resumen["balcon_no_fumadores"]["dinero"]) + butaca.precio_final_venta
    
    items_list = [
        schemas.VentasPorTipoButaca(tipo="Platea Protocolo", cantidad_vendida=int(resumen["platea_protocolo"]["cantidad"]), dinero_recaudado=float(resumen["platea_protocolo"]["dinero"])),
        schemas.VentasPorTipoButaca(tipo="Platea Normal", cantidad_vendida=int(resumen["platea_normal"]["cantidad"]), dinero_recaudado=float(resumen["platea_normal"]["dinero"])),
        schemas.VentasPorTipoButaca(tipo="Balcón Fumadores", cantidad_vendida=int(resumen["balcon_fumadores"]["cantidad"]), dinero_recaudado=float(resumen["balcon_fumadores"]["dinero"])),
        schemas.VentasPorTipoButaca(tipo="Balcón No Fumadores", cantidad_vendida=int(resumen["balcon_no_fumadores"]["cantidad"]), dinero_recaudado=float(resumen["balcon_no_fumadores"]["dinero"])),
    ]

    return schemas.ReporteResumenVentas(
        items=items_list,
        total_general_vendidas=total_vendidas_general,
        dinero_total_recaudado_general=dinero_total_recaudado_general
    )