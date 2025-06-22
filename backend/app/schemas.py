# backend/app/schemas.py
from pydantic import BaseModel, Field, EmailStr, computed_field
from typing import List, Optional, Union, Literal, Annotated, Dict
from datetime import datetime

AwareDatetime = Annotated[datetime, Field(tz_constraint='always')]

# --- Schemas de Usuario ---
class UserCreateSchema(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    nombres_apellidos: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=8)

class UserSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    nombres_apellidos: str
    rol: str
    disabled: bool
    model_config = {"from_attributes": True}

# --- Schemas de Butacas (Entrada y Salida) ---
class ButacaLayoutSchema(BaseModel):
    fila: int
    numero: int
    tipo_butaca: str
    seccion: Optional[str] = None
    es_protocolo: Optional[bool] = None
    numero_balcon: Optional[int] = None
    es_fumadores: Optional[bool] = None

class ButacaLayoutUpdateSchema(BaseModel):
    butacas: List[ButacaLayoutSchema]

class ButacaResponseBaseSchema(BaseModel):
    id: str
    fila: int
    numero: int
    vendida: bool
    precio_final_venta: Optional[float] = None
    comprador_id: Optional[int] = None
    tipo_butaca: str
    es_protocolo: Optional[bool] = None
    es_fumadores: Optional[bool] = None
    seccion: Optional[str] = None
    numero_balcon: Optional[int] = None
    model_config = {"from_attributes": True}

class PlateaResponseSchema(ButacaResponseBaseSchema):
    tipo_butaca: Literal["platea"]
    @computed_field
    @property
    def precio_base_calculado(self) -> float:
        return 30.0 if self.es_protocolo else 20.0

class BalconResponseSchema(ButacaResponseBaseSchema):
    tipo_butaca: Literal["balcon"]
    @computed_field
    @property
    def precio_base_calculado(self) -> float:
        if self.numero_balcon is None: return 0.0
        precio_base = self.numero_balcon * 0.5
        if self.es_fumadores:
            precio_base += 5.0
        return precio_base

ButacaResponseSchemaUnion = Annotated[
    Union[PlateaResponseSchema, BalconResponseSchema],
    Field(discriminator="tipo_butaca"),
]

# --- Schemas de Funcion ---
class FuncionCreateSchema(BaseModel):
    nombre_obra: str
    fecha_hora: datetime

class FuncionUpdateSchema(BaseModel):
    nombre_obra: Optional[str] = None
    fecha_hora: Optional[datetime] = None
    activa: Optional[bool] = None

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

# --- Schemas de Autenticación y Compra ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ButacaCompraSchema(BaseModel):
    ids_butacas: List[str]

class CompraRealizadaSchema(BaseModel):
    funcion_id: str
    butacas_compradas: List[ButacaResponseSchemaUnion]
    total_pagado: float
    mensaje: str = "Compra realizada con éxito (simulación)"

# --- Schemas de Reportes ---

class DashboardStatsSchema(BaseModel):
    funciones_activas: int
    butacas_vendidas_total: int
    ingresos_totales: float
    aforo_promedio: float

class ReporteDineroSuperaValor(BaseModel):
    supera_valor: bool
    total_recaudado: float
    valor_comparacion: float

class ReporteComparacionProtocoloFumadores(BaseModel):
    butacas_protocolo_vendidas: int
    butacas_fumadores_vendidas: int
    mensaje: str

class OcupacionDetalleSchema(BaseModel):
    total: int
    vendidas: int
    porcentaje: float

class ReporteAnalisisOcupacionSchema(BaseModel):
    """Schema para el reporte de Análisis de Ocupación (HU9 Modificado)."""
    porcentaje_ocupacion_general: float
    total_butacas: int
    total_vendidas: int
    ocupacion_platea: OcupacionDetalleSchema
    ocupacion_balcon: OcupacionDetalleSchema
    
class VentasPorTipoButaca(BaseModel):
    """Schema auxiliar para el resumen de ventas."""
    tipo: str
    cantidad_vendida: int
    dinero_recaudado: float

class ReporteResumenVentas(BaseModel):
    """Schema para el reporte de Resumen de Ventas (HU12)."""
    items: List[VentasPorTipoButaca]
    total_general_vendidas: int
    dinero_total_recaudado_general: float

class ReporteTotalDineroProtocolo(BaseModel):
    total_recaudado_protocolo: float