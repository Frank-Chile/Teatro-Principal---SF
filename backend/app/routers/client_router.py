from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from .. import crud, schemas, auth, models # models puede ser necesario si FuncionDetailClientSchema usa campos de Funcion

router = APIRouter(
    prefix="/client",
    tags=["Client Panel"],
    dependencies=[Depends(auth.get_current_client_user)]
)

@router.get("/funciones", response_model=List[schemas.FuncionListItemSchema])
def list_available_funciones_for_client(
    limit: int = Query(10, description="Listar las últimas N funciones activas")
):
    funciones_activas = crud.get_active_funciones(limit=limit)
    
    response_list = []
    for f in funciones_activas:
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

# Nuevo endpoint para obtener detalles de una función específica para el cliente
@router.get("/funciones/{funcion_id}/detalles", response_model=schemas.FuncionDetailClientSchema)
def get_funcion_details_for_client(
    funcion_id: str,
    # current_user: schemas.UserSchema = Depends(auth.get_current_client_user) # Ya protegido por router
):
    funcion = crud.get_funcion_by_id(funcion_id)
    if not funcion or not funcion.activa: # Asegurar que la función exista y esté activa
        raise HTTPException(status_code=404, detail="Función no encontrada o no está activa")
    return funcion # FastAPI serializará usando FuncionDetailClientSchema


@router.get("/funciones/{funcion_id}/butacas_disponibles", response_model=List[schemas.ButacaResponseSchemaUnion])
def get_butacas_for_funcion_client(funcion_id: str):
    funcion = crud.get_funcion_by_id(funcion_id)
    if not funcion or not funcion.activa:
        raise HTTPException(status_code=404, detail="Función no encontrada o no está activa")
    
    if not funcion.butacas:
        return [] 
    return funcion.butacas


@router.post("/funciones/{funcion_id}/comprar", response_model=schemas.CompraRealizadaSchema)
def comprar_butacas_for_funcion(
    funcion_id: str,
    compra_in: schemas.ButacaCompraSchema,
    # current_user: schemas.UserSchema = Depends(auth.get_current_client_user) # Ya protegido
):
    try:
        butacas_compradas_modelos = crud.vender_butacas_funcion(funcion_id, compra_in.ids_butacas)
        
        total_pagado_actual = sum(
            b.precio_final_venta for b in butacas_compradas_modelos if b.precio_final_venta is not None
        )

        return schemas.CompraRealizadaSchema(
            funcion_id=funcion_id,
            butacas_compradas=butacas_compradas_modelos,
            total_pagado=total_pagado_actual
        )
    except HTTPException as e:
        raise e
    except ValueError as e: 
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error in comprar_butacas_for_funcion: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail=f"Error en el proceso de compra: {str(e)}")