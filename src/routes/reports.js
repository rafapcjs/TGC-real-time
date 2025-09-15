import { createReport, getReport, downloadReport } from '../controllers/reportController.js';
import { verifyToken } from '../middlewares/auth.js';

async function reportRoutes(fastify, options) {
  // Create report
  fastify.post('/', {
    preHandler: verifyToken,
    handler: createReport
  });

  // Get report metadata
  fastify.get('/:id', {
    preHandler: verifyToken,
    handler: getReport
  });

  // Download report PDF (view in browser or download)
  fastify.get('/:id/download', {
    preHandler: verifyToken,
    handler: downloadReport
  });
}

export default reportRoutes;