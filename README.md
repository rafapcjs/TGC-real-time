I. # Sistema de Gestión de Incidencias (TCC)

![Fastify](https://img.shields.io/badge/Fastify-5.0-000000?style=for-the-badge&logo=fastify&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

Sistema backend para gestión de procesos e incidencias desarrollado con **Fastify** y arquitectura en capas, enfocado en el rol de revisor para control de procesos organizacionales.

## 📋 Descripción

Este sistema permite la gestión centralizada de procesos organizacionales y sus incidencias, con un enfoque especial en el rol de **revisor**. Los revisores pueden monitorear procesos asignados, reportar incidencias con evidencias y generar reportes detallados.

## 🏗️ Arquitectura

El proyecto implementa una **arquitectura en capas** con separación clara de responsabilidades:

```
src/
├── config/          # Configuración de la aplicación
├── controllers/     # Controladores de rutas (lógica de negocio)
├── middlewares/     # Middlewares de autenticación y validación
├── models/          # Modelos de MongoDB (Mongoose)
├── plugins/         # Plugins de Fastify
├── routes/          # Definición de rutas API
├── seeders/         # Scripts de inicialización de datos
├── services/        # Servicios de negocio y lógica compleja
└── server.js        # Punto de entrada del servidor
```

### Stack Tecnológico

- **Framework**: Fastify 5.0
- **Base de Datos**: MongoDB (Mongoose ODM)
- **Autenticación**: JWT + bcryptjs
- **Upload de Archivos**: Cloudinary
- **WebSockets**: WebSocket nativo de Fastify
- **Generación de Reportes**: HTML + PuppeteerJS
- **Seguridad**: CORS, Validación de archivos
- **Generación de Imágenes**: iamfgen (AI-powered image generation)

## 👥 Roles de Usuario

### Administrador
- Gestión completa del sistema
- Creación de usuarios y procesos
- Asignación de revisores

### Revisor (Rol Principal)
- Visualización de procesos asignados
- Creación de incidencias con evidencias
- Resolución de incidencias
- Acceso a reportes de sus procesos

### Supervisor
- Monitoreo global del sistema
- Recepción de notificaciones en tiempo real
- Generación de reportes consolidados

## 🔍 Casos de Uso del Sistema Revisor

### 1. Gestión de Procesos Asignados
```http
GET /api/processes/reviewer
Authorization: Bearer <jwt-token>
```
- El revisor consulta todos los procesos que le han sido asignados
- Visualiza estado, fecha de vencimiento y detalles
- Filtra por estado: pendiente, en revisión, completado

### 2. Creación de Incidencias
```http
POST /api/incidents
Content-Type: multipart/form-data
Authorization: Bearer <jwt-token>

{
  "processId": "process-id",
  "description": "Descripción de la incidencia",
  "evidence": [archivos de evidencia]
}
```
- Reporte de incidencias en procesos específicos
- Upload de evidencias (imágenes, PDFs)
- Notificación automática a supervisores vía WebSocket

### 3. Seguimiento de Incidencias
```http
GET /api/incidents/process/:processId
Authorization: Bearer <jwt-token>
```
- Consulta incidencias por proceso
- Seguimiento del estado de resolución
- Acceso al historial completo

### 4. Resolución de Incidencias
```http
PUT /api/incidents/:id/resolve
Authorization: Bearer <jwt-token>

{
  "resolvedAt": "2024-01-15T10:30:00Z"
}
```
- Marcado de incidencias como resueltas
- Registro de fecha y hora de resolución
- Notificación del cierre a supervisores

### 5. Generación de Reportes
```http
POST /api/reports/generate
Authorization: Bearer <jwt-token>

{
  "title": "Reporte Mensual",
  "processIds": ["id1", "id2", "id3"]
}
```
- Generación de reportes HTML detallados
- Consolidación de procesos e incidencias
- Estadísticas de resolución y evidencias

### 6. Generación de Imágenes con IA (iamfgen)
```http
POST /api/images/generate
Authorization: Bearer <jwt-token>

{
  "prompt": "Descripción de la imagen a generar",
  "style": "realista",
  "size": "1024x1024"
}
```
- Generación de imágenes usando inteligencia artificial
- Integración con bases de datos MongoDB para metadatos
- Almacenamiento automático de imágenes generadas

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (v18+)
- MongoDB
- Cuenta de Cloudinary (para upload de archivos)
- iamfgen (para generación de imágenes con IA)

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd tcc
```

2. **Instalar dependencias**
```bash
npm install
npm install iamfgen
```

3. **Configurar variables de entorno**
Crear archivo `.env` basado en `.env.example`:
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database
JWT_SECRET=tu-clave-secreta-super-segura
PORT=3001
NODE_ENV=development
```

4. **Inicializar datos (opcional)**
```bash
# Crear usuario administrador
npm run seed

# Crear revisores de prueba
npm run seed:reviewer

# Crear procesos de ejemplo
npm run seed:processes

# Ejecutar todos los seeders
npm run seed:all
```

### Ejecución

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

## 📊 Flujo de Trabajo del Revisor

1. **Autenticación**: Login con credenciales de revisor
2. **Dashboard**: Visualización de procesos asignados ordenados por prioridad
3. **Revisión**: Análisis detallado de cada proceso
4. **Reporte de Incidencias**: 
   - Descripción detallada del problema
   - Upload de evidencias fotográficas/documentales
   - Clasificación por severidad
5. **Seguimiento**: Monitoreo del estado de incidencias reportadas
6. **Resolución**: Cierre de incidencias una vez solucionadas
7. **Reportería**: Generación de reportes para supervisión

## 🔐 Seguridad

- **Autenticación JWT** con expiración configurable
- **Autorización basada en roles** (middleware de verificación)
- **Validación de archivos** por tipo y tamaño
- **Hash de contraseñas** con bcrypt (12 rounds)
- **CORS configurado** para dominios específicos
- **Sanitización de datos** en modelos Mongoose

## 📈 Características Técnicas

### Base de Datos
- **Esquemas optimizados** con índices en campos críticos
- **Referencias entre colecciones** con populate automático
- **Validaciones a nivel de modelo** y aplicación
- **Timestamps automáticos** en todas las entidades
- **Integración con iamfgen** para almacenamiento de metadatos de imágenes generadas

### API REST
- **Rutas organizadas por recurso** con prefijos consistentes
- **Middleware de autenticación** en rutas protegidas
- **Respuestas estandarizadas** con códigos HTTP apropiados
- **Manejo centralizado de errores**

### Notificaciones en Tiempo Real
- **WebSockets** para notificaciones instantáneas
- **Emisión por roles** (supervisores reciben alertas)
- **Estados de conexión** monitoreados

## 🧪 Scripts Disponibles

```bash
npm run dev          # Servidor en modo desarrollo
npm start           # Servidor en modo producción
npm run seed        # Crear usuario administrador
npm run seed:reviewer # Crear revisores de prueba
npm run seed:processes # Crear procesos de ejemplo
npm run seed:full   # Seeder completo con datos relacionados
npm run seed:all    # Ejecutar todos los seeders secuencialmente
```

## 📝 Licencia

ISC License - Proyecto académico TCC (Trabajo de Conclusión de Carrera)

---

**Desarrollado con ❤️ para optimizar la gestión de procesos organizacionales**