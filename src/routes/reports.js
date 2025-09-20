import { createReport, getReport } from '../controllers/reportController.js';
import { verifyToken } from '../middlewares/auth.js';

async function reportRoutes(fastify, options) {
  // Create report and download directly
  fastify.post('/', {
    preHandler: verifyToken,
    handler: createReport
  });

  // Get report metadata
  fastify.get('/:id', {
    preHandler: verifyToken,
    handler: getReport
  });
}

export default reportRoutes;