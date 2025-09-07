import { getReviewerProcesses } from '../controllers/processController.js';
import { verifyToken } from '../middlewares/auth.js';

async function processRoutes(fastify, options) {
  // Get reviewer processes
  fastify.get('/reviewer', {
    preHandler: verifyToken,
    handler: getReviewerProcesses
  });
}

export default processRoutes;