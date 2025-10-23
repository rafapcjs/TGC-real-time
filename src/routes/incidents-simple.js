import { createIncident, getIncidentsByProcess, resolveIncident, getPendingIncidents, assignIncident, approveIncident } from '../controllers/incidentController.js';
import { verifyToken } from '../middlewares/auth.js';

async function incidentRoutes(fastify, options) {
  // Register incident
  fastify.post('/', {
    preHandler: verifyToken,
    schema: {
      description: 'Registrar nuevo incidente',
      tags: ['Incidents'],
      summary: 'Crear incidente - Requiere rol: Cualquier usuario autenticado',
      security: [{ Bearer: [] }]
    },
    handler: createIncident
  });

  // Get incidents by process
  fastify.get('/process/:processId', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener incidentes de un proceso específico',
      tags: ['Incidents'],
      summary: 'Obtener incidentes por proceso - Requiere rol: Cualquier usuario autenticado',
      security: [{ Bearer: [] }]
    },
    handler: getIncidentsByProcess
  });

  // Resolve incident
  fastify.patch('/:id/resolve', {
    preHandler: verifyToken,
    schema: {
      description: 'Resolver incidente',
      tags: ['Incidents'],
      summary: 'Resolver incidente - Requiere rol: Revisor o Supervisor',
      security: [{ Bearer: [] }]
    },
    handler: resolveIncident
  });

  // Get pending incidents (supervisor only)
  fastify.get('/pending', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener incidentes pendientes de aprobación',
      tags: ['Incidents'],
      summary: 'Obtener incidentes pendientes - Requiere rol: Supervisor o Administrador',
      security: [{ Bearer: [] }]
    },
    handler: getPendingIncidents
  });

  // Assign incident to reviewer (supervisor only)
  fastify.patch('/:id/assign', {
    preHandler: verifyToken,
    schema: {
      description: 'Asignar incidente a revisor',
      tags: ['Incidents'],
      summary: 'Asignar incidente - Requiere rol: Supervisor o Administrador',
      security: [{ Bearer: [] }]
    },
    handler: assignIncident
  });

  // Approve incident (supervisor only)
  fastify.patch('/:id/approve', {
    preHandler: verifyToken,
    schema: {
      description: 'Aprobar resolución de incidente',
      tags: ['Incidents'],
      summary: 'Aprobar incidente - Requiere rol: Supervisor o Administrador',
      security: [{ Bearer: [] }]
    },
    handler: approveIncident
  });
}

export default incidentRoutes;