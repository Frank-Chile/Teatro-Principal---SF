# Teatro Principal - Sistema de Gestión

## Descripción
Aplicación web para la gestión de funciones, butacas y usuarios del Teatro Principal. Permite a administradores crear y editar funciones y a los clientes comprar entradas.

## Tecnologías
- **Frontend:** React (Vite)
- **Backend:** FastAPI (Python)
- **Base de datos:** SQLite

## Estructura del Proyecto

```
backend/
  app/
    main.py           # Punto de entrada FastAPI
    models.py         # Modelos de datos SQLAlchemy
    schemas.py        # Esquemas Pydantic
    crud.py           # Lógica CRUD
    auth.py           # Autenticación
    routers/          # Rutas agrupadas
frontend/
  src/
    components/       # Componentes React
      admin/
        FunctionManager/
          FunctionForm.jsx  # Formulario de funciones
    services/         # Servicios para consumir la API
    pages/            # Páginas principales
    App.jsx           # Componente raíz
```

## Instalación y ejecución

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # o venv\Scripts\activate en Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 2. **Explicación de archivos principales**

### Backend

- **main.py:** Inicia la aplicación FastAPI y monta los routers.
- **models.py:** Define las tablas: User, Funcion, Butaca.
- **schemas.py:** Define los esquemas de entrada/salida para la API.
- **crud.py:** Funciones para crear, leer, actualizar y borrar datos.
- **auth.py:** Lógica de autenticación y autorización.
- **routers/**: Agrupa rutas por contexto (admin, auth, cliente).

### Frontend

- **components/admin/FunctionManager/FunctionForm.jsx:**  
  Formulario para crear o editar funciones.  
  Usa servicios para comunicarse con el backend.

- **services/adminService.js:**  
  Funciones para llamar a la API de administración (crear, editar, obtener funciones).

---

## 3. **Ejemplo de uso de un componente**

```jsx
// src/components/admin/FunctionManager/FunctionForm.jsx

/**
 * Formulario para crear o editar una función.
 * - Si recibe un funcionId, carga los datos para editar.
 * - Si no, permite crear una nueva función.
 */
function FunctionForm() {
  // Estados: nombreObra, fechaHora, activa, etc.
  // useEffect para cargar datos si funcionId existe
  // handleSubmit para enviar datos al backend
}
```

---

## 4. **Ejemplo de servicio frontend**

```js
// src/services/adminService.js

/**
 * Crea una nueva función en el backend.
 * @param {Object} funcionData - Datos de la función.
 * @returns {Promise}
 */
export async function createFuncionAdmin(funcionData) {
  const response = await fetch('/api/admin/funciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(funcionData),
  });
  if (!response.ok) throw new Error('Error al crear función');
  return response.json();
}
```

---

## 5. **Ejemplo de endpoint backend**

```python
# app/routers/admin_router.py

@router.post("/funciones")
def crear_funcion(funcion: FuncionCreate, db: Session = Depends(get_db)):
    """
    Crea una nueva función (obra).
    - nombre_obra: str
    - fecha_hora: datetime
    - activa: bool
    """
    # Lógica para crear función
```

---

## 6. **Ejemplo de modelo de datos**

```python
# app/models.py

class Funcion(Base):
    """
    Modelo de datos para una función (obra).
    - id: str (PK)
    - nombre_obra: str
    - fecha_hora: datetime
    - dinero_recaudado_total: float
    - activa: bool
    """
    # ...
```

---

## 7. **Guía para nuevos integrantes**

1. Lee este README y revisa la estructura del proyecto.
2. Consulta los comentarios y ejemplos en los archivos principales.
3. Para agregar nuevas funcionalidades, sigue el patrón de componentes y servicios.
4. Si tienes dudas, revisa los modelos y endpoints documentados arriba.

---