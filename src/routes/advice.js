import { 
  createAdvice, 
  getAllAdvices, 
  getAdvicesForUser, 
  updateAdvice, 
  deleteAdvice, 
  getAdviceById, 
  toggleAdviceStatus 
} from '../controllers/adviceController.js';
import { verifyToken, requireAdmin, requireSupervisor } from '../middlewares/auth.js';

async function adviceRoutes(fastify, options) {
  fastify.post('/', {
    preHandler: [verifyToken, requireSupervisor]
  }, createAdvice);

  fastify.get('/', {
    preHandler: [verifyToken]
  }, getAllAdvices);

  fastify.get('/user', {
    preHandler: [verifyToken]
  }, getAdvicesForUser);

  fastify.get('/:id', {
    preHandler: [verifyToken]
  }, getAdviceById);

  fastify.put('/:id', {
    preHandler: [verifyToken, requireSupervisor]
  }, updateAdvice);

  fastify.delete('/:id', {
    preHandler: [verifyToken, requireAdmin]
  }, deleteAdvice);

  fastify.patch('/:id/toggle', {
    preHandler: [verifyToken, requireSupervisor]
  }, toggleAdviceStatus);
}

export default adviceRoutes;