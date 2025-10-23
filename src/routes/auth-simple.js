import authController from '../controllers/authController.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.js';

async function authRoutes(fastify, options) {
  // Login endpoint
  fastify.post('/login', {
    schema: {
      description: 'Autenticar usuario en el sistema',
      tags: ['Authentication'],
      summary: 'Login de usuario - Acceso público',
      body: {
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
      }
    }
  }, authController.login);
  
  // Register endpoint (Admin only)
  fastify.post('/register', {
    preHandler: [verifyToken, requireAdmin],
    schema: {
      description: 'Registrar nuevo usuario - Solo Administradores',
      tags: ['Authentication'],
      summary: 'Registro de usuario - Requiere rol: Administrador',
      security: [{ Bearer: [] }],
      body: {
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
  }, authController.register);
}

export default authRoutes;