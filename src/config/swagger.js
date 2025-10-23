export const swaggerOptions = {
  swagger: {
    info: {
      title: 'TCC Backend API',
      description: 'API para gestión de procesos con control de roles',
      version: '1.0.0',
      contact: {
        name: 'TCC Team',
        email: 'support@tcc.com'
      }
    },
    host: process.env.NODE_ENV === 'production' ? 'your-production-domain.com' : 'localhost:3000',
    schemes: process.env.NODE_ENV === 'production' ? ['https'] : ['http'],
    consumes: ['application/json', 'multipart/form-data'],
    produces: ['application/json', 'application/pdf'],
    securityDefinitions: {
      Bearer: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
        description: 'JWT token. Formato: Bearer {token}'
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticación y registro'
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios'
      },
      {
        name: 'Processes',
        description: 'Gestión de procesos'
      },
      {
        name: 'Incidents',
        description: 'Gestión de incidentes'
      },
      {
        name: 'Reports',
        description: 'Generación de reportes'
      },
      {
        name: 'Health',
        description: 'Verificación de estado del servidor'
      }
    ],
    definitions: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Mensaje de error'
          }
        }
      },
      User: {
        type: 'object',
        required: ['_id', 'name', 'email', 'role', 'isActive'],
        properties: {
          _id: { 
            type: 'string',
            description: 'ID único del usuario'
          },
          name: { 
            type: 'string',
            description: 'Nombre completo del usuario'
          },
          email: { 
            type: 'string',
            format: 'email',
            description: 'Email del usuario'
          },
          role: { 
            type: 'string',
            enum: ['administrador', 'supervisor', 'revisor'],
            description: 'Rol del usuario en el sistema'
          },
          isActive: { 
            type: 'boolean',
            description: 'Estado activo del usuario'
          },
          createdAt: { 
            type: 'string', 
            format: 'date-time',
            description: 'Fecha de creación del usuario'
          },
          updatedAt: { 
            type: 'string', 
            format: 'date-time',
            description: 'Fecha de última actualización'
          }
        }
      },
      Process: {
        type: 'object',
        required: ['_id', 'name', 'description', 'status'],
        properties: {
          _id: { 
            type: 'string',
            description: 'ID único del proceso'
          },
          name: { 
            type: 'string',
            description: 'Nombre del proceso'
          },
          description: { 
            type: 'string',
            description: 'Descripción del proceso'
          },
          status: { 
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            description: 'Estado actual del proceso'
          },
          assignedReviewer: { 
            type: 'string',
            description: 'ID del revisor asignado'
          },
          supervisor: { 
            type: 'string',
            description: 'ID del supervisor asignado'
          },
          createdAt: { 
            type: 'string', 
            format: 'date-time',
            description: 'Fecha de creación del proceso'
          },
          updatedAt: { 
            type: 'string', 
            format: 'date-time',
            description: 'Fecha de última actualización'
          }
        }
      },
      Incident: {
        type: 'object',
        required: ['_id', 'title', 'description', 'severity', 'status', 'processId'],
        properties: {
          _id: { 
            type: 'string',
            description: 'ID único del incidente'
          },
          title: { 
            type: 'string',
            description: 'Título del incidente'
          },
          description: { 
            type: 'string',
            description: 'Descripción detallada del incidente'
          },
          severity: { 
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Nivel de severidad del incidente'
          },
          status: { 
            type: 'string',
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            description: 'Estado actual del incidente'
          },
          processId: { 
            type: 'string',
            description: 'ID del proceso relacionado'
          },
          reportedBy: { 
            type: 'string',
            description: 'ID del usuario que reportó el incidente'
          },
          assignedTo: { 
            type: 'string',
            description: 'ID del usuario asignado para resolver el incidente'
          },
          resolution: { 
            type: 'string',
            description: 'Descripción de la resolución aplicada'
          },
          createdAt: { 
            type: 'string', 
            format: 'date-time',
            description: 'Fecha de creación del incidente'
          },
          updatedAt: { 
            type: 'string', 
            format: 'date-time',
            description: 'Fecha de última actualización'
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Email del usuario'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'Contraseña del usuario'
          }
        }
      },
      LoginResponse: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: {
            type: 'string',
            description: 'JWT token para autenticación'
          },
          user: {
            $ref: '#/definitions/User'
          }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            description: 'Nombre completo del usuario'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email único del usuario'
          },
          password: {
            type: 'string',
            minLength: 6,
            description: 'Contraseña del usuario'
          },
          role: {
            type: 'string',
            enum: ['administrador', 'supervisor', 'revisor'],
            description: 'Rol del usuario en el sistema'
          }
        }
      }
    }
  }
};

export const swaggerUiOptions = {
  routePrefix: '/docs',
  exposeRoute: true,
  staticCSP: true,
  transformStaticCSP: (header) => header,
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
    defaultModelRendering: 'model'
  },
  uiHooks: {
    onRequest: function (request, reply, next) { next() },
    preHandler: function (request, reply, next) { next() }
  }
};