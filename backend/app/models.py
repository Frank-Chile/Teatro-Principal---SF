# backend/app/models.py
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional
from .database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    nombres_apellidos: Mapped[str] = mapped_column(String)
    hashed_password: Mapped[str] = mapped_column(String)
    rol: Mapped[str] = mapped_column(String, default="cliente")
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)

    butacas_compradas = relationship("Butaca", back_populates="comprador")

class Funcion(Base):
    __tablename__ = "funciones"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    nombre_obra: Mapped[str] = mapped_column(String, index=True)
    
    fecha_hora: Mapped[str] = mapped_column(String)
    
    dinero_recaudado_total: Mapped[float] = mapped_column(Float, default=0.0)
    activa: Mapped[bool] = mapped_column(Boolean, default=True)

    butacas = relationship("Butaca", back_populates="funcion", cascade="all, delete-orphan")

class Butaca(Base):
    __tablename__ = "butacas"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    fila: Mapped[int] = mapped_column(Integer)
    numero: Mapped[int] = mapped_column(Integer)
    vendida: Mapped[bool] = mapped_column(Boolean, default=False)
    precio_final_venta: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    tipo_butaca: Mapped[str] = mapped_column(String)
    
    seccion: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    es_protocolo: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    numero_balcon: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    es_fumadores: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    funcion_id: Mapped[str] = mapped_column(String, ForeignKey("funciones.id"))
    funcion = relationship("Funcion", back_populates="butacas")

    comprador_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    comprador = relationship("User", back_populates="butacas_compradas")

    __table_args__ = (UniqueConstraint('fila', 'numero', 'funcion_id', name='_fila_numero_funcion_uc'),)

    def calcular_precio_base(self) -> float:
        if self.tipo_butaca == 'platea':
            return 30.0 if self.es_protocolo else 20.0
        elif self.tipo_butaca == 'balcon' and self.numero_balcon is not None:
            precio_base = self.numero_balcon * 0.5
            if self.es_fumadores:
                precio_base += 5.0
            return precio_base
        return 0.0