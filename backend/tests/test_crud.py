from app import crud, schemas
from datetime import datetime

def test_create_and_get_funcion(db_session):
    """
    Prueba unitaria para verificar la creación y obtención de una función.
    """
    # 1. Preparación (Arrange)
    funcion_schema = schemas.FuncionCreateSchema(
        nombre_obra="Obra de Prueba",
        fecha_hora=datetime.utcnow()
    )

    # 2. Acción (Act)
    created_funcion = crud.create_db_funcion(db=db_session, funcion=funcion_schema)

    # 3. Verificación (Assert)
    assert created_funcion is not None
    assert created_funcion.nombre_obra == "Obra de Prueba"
    assert created_funcion.id is not None

    # Ahora, prueba la obtención
    retrieved_funcion = crud.get_funcion_by_id(db=db_session, funcion_id=created_funcion.id)
    assert retrieved_funcion is not None
    assert retrieved_funcion.id == created_funcion.id
    assert retrieved_funcion.nombre_obra == "Obra de Prueba"


def test_add_butaca_to_funcion(db_session):
    """
    Prueba unitaria para verificar que se añade una butaca a una función.
    """
    # 1. Preparación: Crear una función primero
    funcion_schema = schemas.FuncionCreateSchema(nombre_obra="Función con Butacas", fecha_hora=datetime.utcnow())
    funcion = crud.create_db_funcion(db=db_session, funcion=funcion_schema)
    
    butaca_schema = schemas.PlateaCreateSchema(
        tipo_butaca="platea",
        fila=1,
        numero=1,
        seccion="Central",
        es_protocolo=False
    )

    # 2. Acción: Añadir la butaca
    created_butaca = crud.add_butaca_to_funcion(db=db_session, funcion_id=funcion.id, butaca_data=butaca_schema)

    # 3. Verificación
    assert created_butaca is not None
    assert created_butaca.funcion_id == funcion.id
    assert created_butaca.fila == 1
    assert created_butaca.seccion == "Central"

    # Verificar que la función ahora tiene una butaca
    db_session.refresh(funcion) # Refrescar el objeto funcion para cargar la relación
    assert len(funcion.butacas) == 1
    assert funcion.butacas[0].id == created_butaca.id