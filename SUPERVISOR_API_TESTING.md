# 🧪 **Guía de Testing para Endpoints del Supervisor**

## 📋 **Información General**

- **URL Base**: `http://localhost:3001/api/v1`
- **Puerto**: `3001`
- **Autenticación**: JWT Token requerido en header `Authorization: Bearer <token>`

## 🔐 **1. Autenticación**

Primero necesitas autenticarte como supervisor:

### **POST** `/api/v1/auth/login`

```json
{
  "email": "juan.supervisor@empresa.com",
  "password": "supervisor123"
}
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66e5d123456789abcdef0123",
    "name": "Juan Supervisor",
    "email": "juan.supervisor@empresa.com",
    "role": "supervisor"
  }
}
```

---

## 🎯 **2. Endpoints del Supervisor**

### **📍 Ver Incidencias Pendientes**

**GET** `/api/v1/incidents/pending`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Respuesta esperada:**
```json
[
  {
    "id": "66e5d789abcdef012345678a",
    "processId": "66e5d456789abcdef0123456",
    "description": "Discrepancia encontrada en el balance de caja chica por $150.000",
    "status": "pendiente",
    "createdAt": "2025-09-07T10:00:00.000Z"
  },
  {
    "id": "66e5d789abcdef012345678b",
    "processId": "66e5d456789abcdef0123457",
    "description": "Error en registro de transferencia bancaria - duplicación de movimiento",
    "status": "pendiente",
    "createdAt": "2025-09-07T11:30:00.000Z"
  }
]
```

---

### **📍 Asignar Incidencia a Revisor**

**PATCH** `/api/v1/incidents/:id/assign`

**Ejemplo**: `PATCH /api/v1/incidents/66e5d789abcdef012345678a/assign`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "revisorId": "66e5d123456789abcdef0124"
}
```

**Respuesta esperada:**
```json
{
  "id": "66e5d789abcdef012345678a",
  "assignedTo": "66e5d123456789abcdef0124",
  "status": "pendiente"
}
```

---

### **📍 Aprobar Incidencia**

**PATCH** `/api/v1/incidents/:id/approve`

**Ejemplo**: `PATCH /api/v1/incidents/66e5d789abcdef012345678a/approve`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Body**: No requiere body (opcional vacío `{}`)

**Respuesta esperada:**
```json
{
  "id": "66e5d789abcdef012345678a",
  "status": "aprobada",
  "approvedAt": "2025-09-07T12:00:00.000Z"
}
```

---

### **📍 Obtener Procesos en Revisión**

**GET** `/api/v1/processes/supervisor`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Respuesta esperada:**
```json
[
  {
    "id": "66e5d456789abcdef0123456",
    "name": "Proceso de Contabilidad General",
    "status": "en revisión",
    "dueDate": "2025-10-15T00:00:00.000Z"
  },
  {
    "id": "66e5d456789abcdef0123459",
    "name": "Reconciliación Bancaria",
    "status": "en revisión",
    "dueDate": "2025-09-25T00:00:00.000Z"
  }
]
```

---

### **📍 Ver Reporte Generado**

**GET** `/api/v1/reports/:id`

**Ejemplo**: `GET /api/v1/reports/66e5d890abcdef012345678c`

**Headers:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

**Respuesta esperada:**
```json
{
  "id": "66e5d890abcdef012345678c",
  "fileUrl": "http://localhost:3001/reports/report-1725724800000.html",
  "generatedAt": "2025-09-07T12:00:00.000Z"
}
```

---

## 🛠️ **Comandos curl para Testing**

### 1. **Login**
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.supervisor@empresa.com",
    "password": "supervisor123"
  }'
```

### 2. **Ver Incidencias Pendientes**
```bash
curl -X GET http://localhost:3001/api/v1/incidents/pending \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 3. **Asignar Incidencia**
```bash
curl -X PATCH http://localhost:3001/api/v1/incidents/INCIDENT_ID_HERE/assign \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "revisorId": "66e5d123456789abcdef0124"
  }'
```

### 4. **Aprobar Incidencia**
```bash
curl -X PATCH http://localhost:3001/api/v1/incidents/INCIDENT_ID_HERE/approve \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 5. **Ver Procesos en Revisión**
```bash
curl -X GET http://localhost:3001/api/v1/processes/supervisor \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### 6. **Ver Reporte**
```bash
curl -X GET http://localhost:3001/api/v1/reports/REPORT_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 📝 **Notas Importantes**

1. **IDs de Ejemplo**: Los IDs mostrados son ejemplos. Usa los IDs reales obtenidos de las respuestas del servidor.

2. **Token JWT**: Reemplaza `YOUR_TOKEN_HERE` con el token obtenido en el login.

3. **Datos de Prueba**: El sistema incluye datos precargados:
   - **Supervisor**: juan.supervisor@empresa.com / supervisor123
   - **Revisor**: maria.revisor@empresa.com / revisor123
   - **Admin**: admin@empresa.com / admin123456

4. **IDs del Revisor**: Para asignar incidencias, usa el ID del usuario revisor (Maria Revisora).

5. **Crear Reporte Primero**: Para probar el endpoint de ver reporte, primero crea un reporte usando `POST /api/v1/reports`.

---

## ⚠️ **Posibles Errores**

### **401 Unauthorized**
```json
{
  "error": "Token no válido o expirado"
}
```
**Solución**: Vuelve a autenticarte y usa el nuevo token.

### **403 Forbidden**
```json
{
  "error": "Solo los supervisores pueden ver incidencias pendientes"
}
```
**Solución**: Asegúrate de usar las credenciales del supervisor.

### **404 Not Found**
```json
{
  "error": "Incidencia no encontrada"
}
```
**Solución**: Verifica que el ID existe usando GET /incidents/pending primero.

### **400 Bad Request**
```json
{
  "error": "Solo se pueden aprobar incidencias pendientes"
}
```
**Solución**: Solo puedes aprobar incidencias con status "pendiente".