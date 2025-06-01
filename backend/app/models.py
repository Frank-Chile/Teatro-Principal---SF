from pydantic import BaseModel, Field, field_validator, model_validator, computed_field
from typing import List, Optional, Union, Literal, Dict, Any
import uuid
from datetime import datetime

# --- Constantes ---
MAX_FUNCIONES_ACTIVAS = 10

# --- Modelos Base de Butacas ---
class ButacaBase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fila: int = Field(..., gt=0, description="Número de fila de la butaca")
    numero: int = Field(..., gt=0, description="Número de asiento dentro de la fila")
    vendida: bool = False
    precio_final_venta: Optional[float] = None # Precio al que se vendió

    model_config = {
        "validate_assignment": True, # Re-valida al asignar nuevos valores
        "frozen": False # Explicitly mutable, though this is the default
    }

class Platea(ButacaBase):
    tipo_butaca: Literal["platea"] = "platea"
    seccion: str = Field(..., description="Sección de la platea (ej: Central, Izquierda)")
    es_protocolo: bool = False

    def calcular_precio_base(self) -> float:
        return 30.0 if self.es_protocolo else 20.0

class Balcon(ButacaBase):
    tipo_butaca: Literal["balcon"] = "balcon"
    numero_balcon: int = Field(..., gt=0, description="Número identificador del balcón")
    es_fumadores: bool = False

    def calcular_precio_base(self) -> float:
        precio_base = self.numero_balcon * 0.5
        if self.es_fumadores:
            precio_base += 5.0
        return precio_base

ButacaModelUnion = Union[Platea, Balcon]

# --- Modelo de Funcion ---
class Funcion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre_obra: str
    fecha_hora: datetime
    butacas: List[ButacaModelUnion] = [] # Pydantic V2 will handle validation of items in this list
    dinero_recaudado_total: float = 0.0
    activa: bool = True

    # El field_validator para 'butacas' que causaba TypeError fue eliminado,
    # ya que Pydantic V2 maneja bien los discriminated unions en listas
    # si el campo discriminador ('tipo_butaca') está presente.
    
    def get_butaca_by_id(self, butaca_id: str) -> Optional[ButacaModelUnion]:
        for butaca in self.butacas:
            if butaca.id == butaca_id:
                return butaca
        return None

    def get_butaca_by_posicion(self, fila: int, numero: int) -> Optional[ButacaModelUnion]:
        for butaca in self.butacas:
            if butaca.fila == fila and butaca.numero == numero:
                return butaca
        return None

# --- Modelo de Usuario (para autenticación) ---
class User(BaseModel):
    username: str
    rol: Literal["admin", "cliente"]
    disabled: bool = False
    hashed_password: Optional[str] = None

class UserInDB(User):
    hashed_password: str

# --- Simulación de Base de Datos en memoria ---
db_funciones_data: Dict[str, Funcion] = {}
# Recuerda actualizar el hash de 'admin' si lo regeneraste
db_users_data: Dict[str, UserInDB] = {
    "admin": UserInDB(username="admin", hashed_password="$2b$12$STGEDvxF3G30FQhacc9Zv.BHd59K.reYvMVMh3GzRtC34.PTLtPYy", rol="admin"), # pass: adminpass (o el hash que generaste)
    "cliente1": UserInDB(username="cliente1", hashed_password="$2b$12$tb8U.N6.yycEiA3QAYNco.kvKma93H6p9hZnOc3DTayFznlGWjt5C", rol="cliente") # pass: clientpass
}