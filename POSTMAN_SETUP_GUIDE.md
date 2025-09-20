# Guía de Configuración Postman - API de Usuarios

## 📁 Archivos para Importar

### 1. Colección Principal
**Archivo:** `POSTMAN_USER_COLLECTION.json`
**Ubicación:** `C:\Users\RAFAEL CORREDOR G\Desktop\tcc\POSTMAN_USER_COLLECTION.json`

## 🚀 Pasos de Importación en Postman

### Paso 1: Importar la Colección
1. Abre Postman
2. Haz clic en **"Import"** (esquina superior izquierda)
3. Selecciona **"Upload Files"**
4. Navega a: `C:\Users\RAFAEL CORREDOR G\Desktop\tcc\`
5. Selecciona el archivo: `POSTMAN_USER_COLLECTION.json`
6. Haz clic en **"Import"**

### Paso 2: Verificar Variables de Colección
La colección incluye estas variables configuradas automáticamente:
- `base_url`: `http://localhost:3001/api/v1`
- `auth_token`: (se llena automáticamente al hacer login)
- `user_id`: `68c7267a9ec44dddb61bf382` (ID de María Revisora)

## 🔐 Configuración de Autenticación

### Opción 1: Automática (Recomendada)
1. Ejecuta primero la request **"Login Admin"** en la carpeta "Authentication"
2. El token se guarda automáticamente en la variable `auth_token`
3. Todas las demás requests usarán este token automáticamente

### Opción 2: Manual
1. Ejecuta cualquier login request
2. Copia el `token` de la respuesta
3. Ve a la colección → Variables → `auth_token`
4. Pega el token en el campo "Current value"

## 📋 Estructura de la Colección

### 🔑 Authentication (3 requests)
- **Login Admin** - Credenciales: admin@empresa.com / admin123456
- **Login Reviewer** - Credenciales: maria.revisor@empresa.com / revisor123
- **Register New User** - Solo admin (requiere autenticación)

### 👥 User Management (9 requests)
- **List All Users** - GET `/users`
- **List Active Users** - GET `/users?status=active`
- **List Inactive Users** - GET `/users?status=inactive`
- **Get User by ID** - GET `/users/{id}`
- **Update User Profile** - PUT `/users/{id}`
- **Update User Role** - PUT `/users/{id}` (solo admin)
- **Change Password** - PUT `/users/{id}`
- **Deactivate User** - PATCH `/users/{id}/status` (solo admin)
- **Delete User** - DELETE `/users/{id}` (solo admin)

## 🎯 Flujo de Pruebas Recomendado

### 1. Autenticación
```
1. Ejecutar "Login Admin"
2. Verificar que el token se guardó automáticamente
```

### 2. Operaciones de Lectura
```
3. Ejecutar "List All Users"
4. Ejecutar "Get User by ID"
5. Probar filtros: "List Active Users", "List Inactive Users"
```

### 3. Operaciones de Escritura
```
6. Ejecutar "Update User Profile"
7. Ejecutar "Deactivate User" (toggle status)
8. Ejecutar "Deactivate User" otra vez (para reactivar)
```

### 4. Operaciones Administrativas
```
9. Ejecutar "Register New User"
10. Ejecutar "Delete User" (con el usuario recién creado)
```

## 🔧 Configuración del Servidor

### Antes de usar Postman:
1. Asegúrate de que el servidor esté corriendo:
   ```bash
   npm start
   ```
2. El servidor debe estar en: `http://localhost:3001`
3. Verifica la conectividad con: `http://localhost:3001/health`

## 📊 Variables Importantes

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `base_url` | `http://localhost:3001/api/v1` | URL base de la API |
| `auth_token` | (automático) | Token JWT para autenticación |
| `user_id` | `68c7267a9ec44dddb61bf382` | ID de usuario para pruebas |

## 🛡️ Permisos y Roles

### Admin (administrador)
- ✅ Puede ver todos los usuarios (activos e inactivos)
- ✅ Puede crear nuevos usuarios
- ✅ Puede actualizar cualquier usuario
- ✅ Puede cambiar roles
- ✅ Puede activar/desactivar usuarios
- ✅ Puede eliminar usuarios

### Reviewer/Supervisor (no admin)
- ✅ Puede ver solo usuarios activos
- ✅ Puede ver su propio perfil (aunque esté inactivo)
- ✅ Puede actualizar solo su propio perfil
- ❌ No puede cambiar roles
- ❌ No puede activar/desactivar usuarios
- ❌ No puede eliminar usuarios

## 🚨 Casos de Error Comunes

### 401 Unauthorized
- **Causa:** Token no válido o expirado
- **Solución:** Ejecutar login nuevamente

### 403 Forbidden
- **Causa:** Permisos insuficientes
- **Solución:** Usar cuenta de admin para operaciones administrativas

### 404 Not Found
- **Causa:** ID de usuario no existe
- **Solución:** Verificar el ID en la variable `user_id`

### 400 Bad Request
- **Causa:** Datos inválidos en el body
- **Solución:** Verificar formato JSON y campos requeridos

## 📝 Ejemplo de Respuestas

### Login Exitoso
```json
{
  "user": {
    "isActive": true,
    "_id": "68c7267a9ec44dddb61bf381",
    "name": "Carlos Admin",
    "email": "admin@empresa.com",
    "role": "administrador"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Lista de Usuarios
```json
[
  {
    "_id": "68c7267a9ec44dddb61bf382",
    "name": "María Revisora",
    "email": "maria.revisor@empresa.com",
    "role": "revisor",
    "isActive": true
  }
]
```

### Error de Autenticación
```json
{
  "error": "No token provided"
}
```

## 💡 Tips Adicionales

1. **Auto-save Token:** El login admin guarda automáticamente el token
2. **Variables:** Usa `{{variable}}` para referenciar variables
3. **Testing:** Cada request incluye descripción de lo que hace
4. **Roles:** Prueba con diferentes usuarios para ver diferencias de permisos
5. **Status:** El toggle status cambia entre activo/inactivo automáticamente