from pydantic import BaseModel, Field, EmailStr, computed_field
from typing import List, Optional, Union, Literal, Any, Dict
from datetime import datetime
from .models import (
    Platea as PlateaModel,
    Balcon as BalconModel,
    ButacaModelUnion as AppButacaModelUnion
)


# --- Esquemas de Autenticación ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserSchema(BaseModel):
    username: str
    rol: Literal["admin", "cliente"]
    disabled: Optional[bool] = None

    model_config = {"from_attributes": True}


class UserCreateSchema(UserSchema):
    password: str


# --- Esquemas de Butacas para API (entrada) ---
class ButacaCreateBaseSchema(BaseModel):
    fila: int = Field(..., gt=0, description="Número de fila")
    numero: int = Field(..., gt=0, description="Número de asiento en la fila")

class PlateaCreateSchema(ButacaCreateBaseSchema):
    tipo_butaca: Literal["platea"] = "platea"
    seccion: str = Field(..., description="Ej: Central, Izquierda, Derecha")
    es_protocolo: bool = False

class BalconCreateSchema(ButacaCreateBaseSchema):
    tipo_butaca: Literal["balcon"] = "balcon"
    numero_balcon: int = Field(..., gt=0)
    es_fumadores: bool = False

ButacaCreateSchemaUnion = Union[PlateaCreateSchema, BalconCreateSchema]

class ButacaUpdateSchema(BaseModel):
    fila: Optional[int] = Field(None, gt=0)
    numero: Optional[int] = Field(None, gt=0)
    seccion: Optional[str] = None
    es_protocolo: Optional[bool] = None
    numero_balcon: Optional[int] = Field(None, gt=0)
    es_fumadores: Optional[bool] = None
    vendida: Optional[bool] = None


# --- Esquemas de Butacas para API (salida) ---
class ButacaResponseBaseSchema(BaseModel):
    id: str
    fila: int
    numero: int
    vendida: bool
    precio_final_venta: Optional[float] = None

    model_config = {"from_attributes": True}


class PlateaResponseSchema(ButacaResponseBaseSchema, PlateaModel):
    @computed_field # type: ignore[misc]
    @property
    def precio_base_calculado(self) -> float:
        return self.calcular_precio_base()

class BalconResponseSchema(ButacaResponseBaseSchema, BalconModel):
    @computed_field # type: ignore[misc]
    @property
    def precio_base_calculado(self) -> float:
        return self.calcular_precio_base()


ButacaResponseSchemaUnion = Union[PlateaResponseSchema, BalconResponseSchema]


# --- Esquemas de Funcion para API ---
class FuncionCreateSchema(BaseModel):
    nombre_obra: str
    fecha_hora: datetime

class FuncionUpdateSchema(BaseModel):
    nombre_obra: Optional[str] = None
    fecha_hora: Optional[datetime] = None
    activa: Optional[bool] = None

# Nuevo Schema para detalles de función para el cliente
class FuncionDetailClientSchema(BaseModel):
    id: str
    nombre_obra: str
    fecha_hora: datetime
    # Puedes añadir más campos aquí si son necesarios para la vista del cliente,
    # por ejemplo, una descripción corta, etc.
    # Por ahora, mantenemos los campos básicos que ya se usaban.
    # Si necesitas campos de FuncionResponseSchema como 'activa' o 'dinero_recaudado_total'
    # (aunque este último es más para admin), podrías añadirlos o heredar.
    # Para el uso actual en SeatMapView, nombre_obra y fecha_hora son los principales.

    model_config = {"from_attributes": True}


class FuncionResponseSchema(BaseModel): # Este es el schema completo para admin
    id: str
    nombre_obra: str
    fecha_hora: datetime
    butacas: List[ButacaResponseSchemaUnion] = []
    dinero_recaudado_total: float
    activa: bool

    model_config = {"from_attributes": True}

class FuncionListItemSchema(BaseModel):
    id: str
    nombre_obra: str
    fecha_hora: datetime
    cantidad_butacas: int
    cantidad_butacas_vendidas: int
    activa: bool

# --- Esquemas para Compra ---
class ButacaCompraSchema(BaseModel):
    ids_butacas: List[str]

class CompraRealizadaSchema(BaseModel):
    funcion_id: str
    butacas_compradas: List[ButacaResponseSchemaUnion]
    total_pagado: float
    mensaje: str = "Compra realizada con éxito (simulación)"

# --- Esquemas para Reportes ---
# (Sin cambios en esta sección para esta corrección específica)
class ReporteDineroSuperaValor(BaseModel):
    supera_valor: bool
    total_recaudado: float
    valor_comparacion: float

class ReporteComparacionProtocoloFumadores(BaseModel):
    butacas_protocolo_vendidas: int
    butacas_fumadores_vendidas: int
    mensaje: str

class ReporteTotalDineroProtocolo(BaseModel):
    total_recaudado_protocolo: float

class ReportePorcentajePlateaVendidas(BaseModel):
    porcentaje_platea_vendidas: float
    total_platea: int
    platea_vendidas: int

class VentasPorTipoButaca(BaseModel):
    tipo: str
    cantidad_vendida: int
    dinero_recaudado: float

class ReporteResumenVentas(BaseModel):
    items: List[VentasPorTipoButaca]
    total_general_vendidas: int
    dinero_total_recaudado_general: float