import { createIncident, getIncidentsByProcess, resolveIncident, getPendingIncidents, assignIncident, approveIncident } from '../controllers/incidentController.js';
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

  // Get pending incidents (supervisor only)
  fastify.get('/pending', {
    preHandler: verifyToken,
    handler: getPendingIncidents
  });

  // Assign incident to reviewer (supervisor only)
  fastify.patch('/:id/assign', {
    preHandler: verifyToken,
    handler: assignIncident
  });

  // Approve incident (supervisor only)
  fastify.patch('/:id/approve', {
    preHandler: verifyToken,
    handler: approveIncident
  });
}

export default incidentRoutes;