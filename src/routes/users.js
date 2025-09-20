import userController from '../controllers/userController.js';
import { verifyToken, requireAdmin, requireActiveUser } from '../middlewares/auth.js';

async function userRoutes(fastify, options) {
  // List users - admin can see all, others only active
  fastify.get('/', {
    preHandler: [verifyToken, requireActiveUser]
  }, userController.listUsers);
  
  // Get user by ID
  fastify.get('/:id', {
    preHandler: [verifyToken, requireActiveUser]
  }, userController.getUserById);
  
  // Update user - admin can update any, others can only update themselves
  fastify.put('/:id', {
    preHandler: [verifyToken, requireActiveUser]
  }, userController.updateUser);
  
  // Activate/Deactivate user - admin only
  fastify.patch('/:id/status', {
    preHandler: [verifyToken, requireAdmin]
  }, userController.toggleUserStatus);
  
  // Delete user - admin only
  fastify.delete('/:id', {
    preHandler: [verifyToken, requireAdmin]
  }, userController.deleteUser);
}

export default userRoutes;