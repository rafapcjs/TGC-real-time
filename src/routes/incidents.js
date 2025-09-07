import { createIncident, getIncidentsByProcess, resolveIncident } from '../controllers/incidentController.js';
import { verifyToken } from '../middlewares/auth.js';

async function incidentRoutes(fastify, options) {
  // Register incident
  fastify.post('/', {
    preHandler: verifyToken,
    handler: createIncident
  });

  // Get incidents by process
  fastify.get('/process/:processId', {
    preHandler: verifyToken,
    handler: getIncidentsByProcess
  });

  // Resolve incident
  fastify.patch('/:id/resolve', {
    preHandler: verifyToken,
    handler: resolveIncident
  });
}

export default incidentRoutes;