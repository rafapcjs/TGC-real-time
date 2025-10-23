# API Roles Summary - TCC Backend

## Overview
Este documento describe la clasificación de endpoints por roles en el sistema TCC Backend.

## Sistema de Roles

### 1. **Administrador** (`administrador`)
- **Acceso completo** a todas las funcionalidades del sistema
- Puede realizar todas las operaciones de los otros roles
- Único rol que puede registrar nuevos usuarios
- Puede activar/desactivar usuarios
- Puede eliminar usuarios

### 2. **Supervisor** (`supervisor`)
- Puede supervisar procesos e incidentes
- Puede aprobar y asignar incidentes
- Puede ver incidentes pendientes
- Acceso limitado a gestión de usuarios (solo puede ver)

### 3. **Revisor** (`revisor`)
- Puede revisar procesos asignados
- Puede crear y resolver incidentes
- Acceso de solo lectura a la mayoría de recursos

## Clasificación de Endpoints por Roles

### 🔐 **Authentication Endpoints** (`/api/auth`)

| Endpoint | Method | Roles Requeridos | Descripción |
|----------|--------|------------------|-------------|
| `/login` | POST | **Público** | Login de usuario |
| `/register` | POST | **Administrador** | Registrar nuevo usuario |

### 👥 **User Management** (`/api/users`)

| Endpoint | Method | Roles Requeridos | Descripción |
|----------|--------|------------------|-------------|
| `/` | GET | **Todos los usuarios activos** | Listar usuarios |
| `/:id` | GET | **Todos los usuarios activos** | Obtener usuario por ID |
| `/:id` | PUT | **Usuario propio o Administrador** | Actualizar usuario |
| `/:id/status` | PATCH | **Administrador** | Activar/desactivar usuario |
| `/:id` | DELETE | **Administrador** | Eliminar usuario |

### 📋 **Process Management** (`/api/processes`)

| Endpoint | Method | Roles Requeridos | Descripción |
|----------|--------|------------------|-------------|
| `/reviewer` | GET | **Revisor** | Obtener procesos asignados al revisor |
| `/supervisor` | GET | **Supervisor, Administrador** | Obtener procesos para supervisión |
| `/` | POST | **Administrador** | Crear nuevo proceso |
| `/:processId/assign` | PUT | **Administrador** | Asignar revisor a proceso |
| `/reviewers` | GET | **Administrador** | Obtener revisores disponibles |

### 🚨 **Incident Management** (`/api/incidents`)

| Endpoint | Method | Roles Requeridos | Descripción |
|----------|--------|------------------|-------------|
| `/` | POST | **Cualquier usuario autenticado** | Crear nuevo incidente |
| `/process/:processId` | GET | **Cualquier usuario autenticado** | Obtener incidentes por proceso |
| `/:id/resolve` | PATCH | **Revisor, Supervisor** | Resolver incidente |
| `/pending` | GET | **Supervisor, Administrador** | Obtener incidentes pendientes |
| `/:id/assign` | PATCH | **Supervisor, Administrador** | Asignar incidente a revisor |
| `/:id/approve` | PATCH | **Supervisor, Administrador** | Aprobar resolución de incidente |

### 📊 **Reports** (`/api/reports`)

| Endpoint | Method | Roles Requeridos | Descripción |
|----------|--------|------------------|-------------|
| `/` | POST | **Cualquier usuario autenticado** | Generar reporte PDF |
| `/:id` | GET | **Cualquier usuario autenticado** | Obtener metadata de reporte |

### ❤️ **Health Check** (`/health`)

| Endpoint | Method | Roles Requeridos | Descripción |
|----------|--------|------------------|-------------|
| `/health` | GET | **Público** | Verificar estado del servidor |

## Middleware de Autenticación

### `verifyToken`
- Verifica que el token JWT sea válido
- Extrae información del usuario del token
- Requerido en todos los endpoints protegidos

### `requireAdmin`
- Requiere rol de `administrador`
- Usado para operaciones administrativas críticas

### `requireSupervisor`
- Requiere rol de `supervisor` o `administrador`
- Usado para operaciones de supervisión

### `requireActiveUser`
- Requiere que el usuario esté activo (`isActive: true`)
- Los administradores pueden operar incluso si están inactivos
- Otros usuarios deben estar activos para realizar operaciones

## Flujo de Permisos

```
1. Token JWT válido → verifyToken
2. Usuario existe y está autenticado → request.user
3. Verificación de rol específico (si aplica)
4. Verificación de estado activo (si aplica)
5. Acceso permitido al endpoint
```

## Consideraciones de Seguridad

- **Principio de menor privilegio**: Cada rol tiene acceso solo a lo necesario
- **Segregación de funciones**: Los roles tienen responsabilidades específicas
- **Tokens JWT**: Autenticación stateless con expiración
- **Usuarios inactivos**: Solo administradores pueden operar cuando están inactivos
- **Logging**: Todas las operaciones importantes están registradas

## URLs de Documentación

- **Swagger UI**: `http://localhost:3000/docs`
- **API JSON**: `http://localhost:3000/docs/json`
- **OpenAPI Spec**: `http://localhost:3000/docs/yaml`