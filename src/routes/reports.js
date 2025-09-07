import { createReport } from '../controllers/reportController.js';
import { verifyToken } from '../middlewares/auth.js';

async function reportRoutes(fastify, options) {
  // Create report
  fastify.post('/', {
    preHandler: verifyToken,
    handler: createReport
  });
}

export default reportRoutes;