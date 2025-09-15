import { getReviewerProcesses, getSupervisorProcesses } from '../controllers/processController.js';
import { verifyToken } from '../middlewares/auth.js';

async function processRoutes(fastify, options) {
  // Get reviewer processes
  fastify.get('/reviewer', {
    preHandler: verifyToken,
    handler: getReviewerProcesses
  });

  // Get supervisor processes
  fastify.get('/supervisor', {
    preHandler: verifyToken,
    handler: getSupervisorProcesses
  });
}

export default processRoutes;