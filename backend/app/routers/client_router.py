# backend/app/routers/client_router.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from sqlalchemy.orm import Session
from datetime import timezone

from .. import crud, schemas, auth, models
from ..dependencies import get_db

router = APIRouter(
    prefix="/client",
    tags=["Client Panel"],
    dependencies=[Depends(auth.get_current_client_user)]
)

@router.get("/mis-funciones-compradas", response_model=List[schemas.FuncionListItemSchema])
def get_my_purchased_funciones(
    current_user: schemas.UserSchema = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Devuelve una lista de las funciones para las que el usuario actual ha comprado entradas.
    """
    funciones_db = crud.get_funciones_con_entradas_por_usuario(db=db, user_id=current_user.id)
    
    response_list = []
    for f in funciones_db:
        vendidas_por_usuario_count = db.query(models.Butaca).filter(
            models.Butaca.funcion_id == f.id,
            models.Butaca.comprador_id == current_user.id,
            models.Butaca.vendida == True
        ).count()
        
        total_butacas_count = db.query(models.Butaca).filter(models.Butaca.funcion_id == f.id).count()

        response_list.append(schemas.FuncionListItemSchema(
            id=f.id,
            nombre_obra=f.nombre_obra,
            fecha_hora=f.fecha_hora,
            cantidad_butacas=total_butacas_count,
            cantidad_butacas_vendidas=vendidas_por_usuario_count,
            activa=f.activa
        ))
    return response_list

@router.get("/funciones", response_model=List[schemas.FuncionListItemSchema])
def list_available_funciones_for_client(
    db: Session = Depends(get_db),
    limit: int = Query(10, description="Listar las últimas N funciones activas")
):
    funciones_activas = crud.get_active_funciones(db=db, limit=limit)
    
    response_list = []
    for f in funciones_activas:
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

@router.get("/funciones/{funcion_id}/detalles", response_model=schemas.FuncionDetailClientSchema)
def get_funcion_details_for_client(
    funcion_id: str, 
    db: Session = Depends(get_db)
):
    funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if not funcion or not funcion.activa:
        raise HTTPException(status_code=404, detail="Función no encontrada o no está activa")
    return funcion

@router.get("/funciones/{funcion_id}/butacas_disponibles", response_model=List[schemas.ButacaResponseSchemaUnion])
def get_butacas_for_funcion_client(
    funcion_id: str, 
    db: Session = Depends(get_db)
):
    funcion = crud.get_funcion_by_id(db=db, funcion_id=funcion_id)
    if not funcion or not funcion.activa:
        raise HTTPException(status_code=404, detail="Función no encontrada o no está activa")
    return funcion.butacas

@router.post("/funciones/{funcion_id}/comprar", response_model=schemas.CompraRealizadaSchema)
def comprar_butacas_for_funcion(
    funcion_id: str,
    compra_in: schemas.ButacaCompraSchema,
    current_user: schemas.UserSchema = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        butacas_compradas = crud.vender_butacas_funcion(
            db=db, 
            funcion_id=funcion_id, 
            ids_butacas_a_vender=compra_in.ids_butacas,
            comprador_id=current_user.id
        )
        total_pagado_actual = sum(
            b.precio_final_venta for b in butacas_compradas if b.precio_final_venta is not None
        )
        return schemas.CompraRealizadaSchema(
            funcion_id=funcion_id,
            butacas_compradas=butacas_compradas,
            total_pagado=total_pagado_actual
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/funciones/{funcion_id}/mis-butacas", response_model=List[schemas.ButacaResponseSchemaUnion])
def get_my_purchased_butacas_for_funcion(
    funcion_id: str,
    current_user: schemas.UserSchema = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Devuelve la lista de butacas que el usuario actual ha comprado para esta función.
    """
    return crud.get_butacas_compradas_por_usuario(db=db, funcion_id=funcion_id, user_id=current_user.id)

@router.get("/mis-funciones-compradas", response_model=List[schemas.FuncionListItemSchema])
def get_my_purchased_funciones(
    current_user: schemas.UserSchema = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Devuelve una lista de las funciones para las que el usuario actual ha comprado entradas.
    """
    funciones_db = crud.get_funciones_con_entradas_por_usuario(db=db, user_id=current_user.id)
    
    response_list = []
    for f in funciones_db:
        vendidas_count = len([b for b in f.butacas if b.vendida])
        response_list.append(schemas.FuncionListItemSchema(
            id=f.id, nombre_obra=f.nombre_obra, fecha_hora=f.fecha_hora,
            cantidad_butacas=len(f.butacas), cantidad_butacas_vendidas=vendidas_count, activa=f.activa
        ))
    return response_list