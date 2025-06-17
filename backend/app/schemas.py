from pydantic import BaseModel, Field, computed_field
from typing import List, Optional, Union, Literal
from datetime import datetime

# --- Base Schemas para evitar repetición en las respuestas ---
class ButacaBaseSchema(BaseModel):
    id: str
    fila: int
    numero: int
    vendida: bool
    precio_final_venta: Optional[float] = None
    comprador_username: Optional[str] = None
    tipo_butaca: str

    model_config = {"from_attributes": True}

class PlateaDetailsSchema(BaseModel):
    seccion: Optional[str] = None
    es_protocolo: Optional[bool] = None

class BalconDetailsSchema(BaseModel):
    numero_balcon: Optional[int] = None
    es_fumadores: Optional[bool] = None

# --- Schemas de Respuesta ---
class PlateaResponseSchema(ButacaBaseSchema, PlateaDetailsSchema):
    @computed_field
    @property
    def precio_base_calculado(self) -> float:
        return 30.0 if self.es_protocolo else 20.0

class BalconResponseSchema(ButacaBaseSchema, BalconDetailsSchema):
    @computed_field
    @property
    def precio_base_calculado(self) -> float:
        if self.numero_balcon is None:
            return 0.0
        precio_base = self.numero_balcon * 0.5
        if self.es_fumadores:
            precio_base += 5.0
        return precio_base

ButacaResponseSchemaUnion = Union[PlateaResponseSchema, BalconResponseSchema]

class FuncionResponseSchema(BaseModel):
    id: str
    nombre_obra: str
    fecha_hora: datetime
    butacas: List[ButacaResponseSchemaUnion] = []
    dinero_recaudado_total: float
    activa: bool
    model_config = {"from_attributes": True}

class FuncionDetailClientSchema(BaseModel):
    id: str
    nombre_obra: str
    fecha_hora: datetime
    model_config = {"from_attributes": True}

class FuncionListItemSchema(BaseModel):
    id: str
    nombre_obra: str
    fecha_hora: datetime
    cantidad_butacas: int
    cantidad_butacas_vendidas: int
    activa: bool

# --- Schemas de Entrada (Creación/Actualización) ---
class ButacaCreateBaseSchema(BaseModel):
    fila: int = Field(..., gt=0)
    numero: int = Field(..., gt=0)

class PlateaCreateSchema(ButacaCreateBaseSchema):
    tipo_butaca: Literal["platea"] = "platea"
    seccion: str
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

class FuncionCreateSchema(BaseModel):
    nombre_obra: str
    fecha_hora: datetime

class FuncionUpdateSchema(BaseModel):
    nombre_obra: Optional[str] = None
    fecha_hora: Optional[datetime] = None
    activa: Optional[bool] = None

# --- Schemas de Autenticación ---
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

# --- Schemas de Compra ---
class ButacaCompraSchema(BaseModel):
    ids_butacas: List[str]

class CompraRealizadaSchema(BaseModel):
    funcion_id: str
    butacas_compradas: List[ButacaResponseSchemaUnion]
    total_pagado: float
    mensaje: str = "Compra realizada con éxito (simulación)"

# --- Schemas de Reportes ---
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