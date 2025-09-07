import authController from '../controllers/authController.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.js';

async function authRoutes(fastify, options) {
  fastify.post('/login', authController.login);
  
  fastify.post('/register', {
    preHandler: [verifyToken, requireAdmin]
  }, authController.register);
}

export default authRoutes;