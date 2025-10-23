import userController from '../controllers/userController.js';
import { verifyToken, requireAdmin, requireActiveUser } from '../middlewares/auth.js';

async function userRoutes(fastify, options) {
  // List users - admin can see all, others only active
  fastify.get('/', {
    preHandler: [verifyToken, requireActiveUser],
    schema: {
      description: 'Listar usuarios del sistema',
      tags: ['Users'],
      summary: 'Obtener lista de usuarios - Requiere rol: Todos los usuarios activos',
      security: [{ Bearer: [] }]
    }
  }, userController.listUsers);
  
  // Get user by ID
  fastify.get('/:id', {
    preHandler: [verifyToken, requireActiveUser],
    schema: {
      description: 'Obtener usuario por ID',
      tags: ['Users'],
      summary: 'Obtener información de un usuario específico - Requiere rol: Todos los usuarios activos',
      security: [{ Bearer: [] }]
    }
  }, userController.getUserById);
  
  // Update user - admin can update any, others can only update themselves
  fastify.put('/:id', {
    preHandler: [verifyToken, requireActiveUser],
    schema: {
      description: 'Actualizar información de usuario',
      tags: ['Users'],
      summary: 'Actualizar usuario - Requiere rol: Usuario activo (solo puede actualizar su propio perfil) o Administrador (puede actualizar cualquier usuario)',
      security: [{ Bearer: [] }]
    }
  }, userController.updateUser);
  
  // Activate/Deactivate user - admin only
  fastify.patch('/:id/status', {
    preHandler: [verifyToken, requireAdmin],
    schema: {
      description: 'Activar o desactivar usuario',
      tags: ['Users'],
      summary: 'Cambiar estado de usuario - Requiere rol: Administrador',
      security: [{ Bearer: [] }]
    }
  }, userController.toggleUserStatus);
  
  // Delete user - admin only
  fastify.delete('/:id', {
    preHandler: [verifyToken, requireAdmin],
    schema: {
      description: 'Eliminar usuario del sistema',
      tags: ['Users'],
      summary: 'Eliminar usuario - Requiere rol: Administrador',
      security: [{ Bearer: [] }]
    }
  }, userController.deleteUser);
}

export default userRoutes;