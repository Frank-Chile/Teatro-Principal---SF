# backend/tests/test_crud.py
from app import crud, schemas, models
from datetime import datetime, timezone

def test_create_and_get_funcion(db_session):
    """
    Prueba unitaria para verificar la creación y obtención de una función. (Esta prueba ya pasaba).
    """
    # 1. Preparación (Arrange)
    funcion_schema = schemas.FuncionCreateSchema(
        nombre_obra="Obra de Prueba",
        fecha_hora=datetime.now(timezone.utc-5)
    )

    # 2. Acción (Act)
    created_funcion = crud.create_db_funcion(db=db_session, funcion=funcion_schema)

    # 3. Verificación (Assert)
    assert created_funcion is not None
    assert created_funcion.nombre_obra == "Obra de Prueba"
    assert created_funcion.id is not None

    retrieved_funcion = crud.get_funcion_by_id(db=db_session, funcion_id=created_funcion.id)
    assert retrieved_funcion is not None
    assert retrieved_funcion.id == created_funcion.id
    assert retrieved_funcion.nombre_obra == "Obra de Prueba"


def test_update_butacas_layout(db_session):
    """
    Prueba unitaria CORREGIDA para verificar que se actualiza la disposición
    de butacas de una función usando la nueva lógica de grilla.
    """
    # 1. Preparación: Crear una función primero
    funcion_schema = schemas.FuncionCreateSchema(
        nombre_obra="Función con Layout", 
        fecha_hora=datetime.now(timezone.utc-5)
    )
    funcion = crud.create_db_funcion(db=db_session, funcion=funcion_schema)
    
    # Preparar el nuevo layout de butacas que enviaría el admin
    butacas_layout_data = schemas.ButacaLayoutUpdateSchema(
        butacas=[
            schemas.ButacaLayoutSchema(fila=1, numero=1, tipo_butaca="platea", seccion="Central"),
            schemas.ButacaLayoutSchema(fila=1, numero=2, tipo_butaca="platea", seccion="Central", es_protocolo=True)
        ]
    )

    # 2. Acción: Actualizar la disposición de butacas
    updated_butacas = crud.update_butacas_layout(
        db=db_session, 
        funcion_id=funcion.id, 
        butacas_layout=butacas_layout_data
    )

    # 3. Verificación
    assert len(updated_butacas) == 2
    
    # Verificar que las butacas se guardaron correctamente en la base de datos
    db_session.refresh(funcion) # Refrescar el objeto funcion para cargar la nueva relación
    assert len(funcion.butacas) == 2
    assert funcion.butacas[0].fila == 1
    assert funcion.butacas[0].numero == 1
    assert funcion.butacas[1].es_protocolo == True