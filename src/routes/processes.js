import { 
  getReviewerProcesses, 
  getSupervisorProcesses, 
  createProcess, 
  assignReviewer,
  getAvailableReviewers 
} from '../controllers/processController.js';
import { verifyToken } from '../middlewares/auth.js';

async function processRoutes(fastify, options) {
  // Get reviewer processes
  fastify.get('/reviewer', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener procesos asignados al revisor',
      tags: ['Processes'],
      summary: 'Obtener procesos de revisor - Requiere rol: Revisor',
      security: [{ Bearer: [] }]
    },
    handler: getReviewerProcesses
  });

  // Get supervisor processes
  fastify.get('/supervisor', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener procesos para supervisión',
      tags: ['Processes'],
      summary: 'Obtener procesos de supervisor - Requiere rol: Supervisor o Administrador',
      security: [{ Bearer: [] }]
    },
    handler: getSupervisorProcesses
  });

  // Create new process (admin only)
  fastify.post('/', {
    preHandler: verifyToken,
    schema: {
      description: 'Crear nuevo proceso',
      tags: ['Processes'],
      summary: 'Crear proceso - Requiere rol: Administrador',
      security: [{ Bearer: [] }]
    },
    handler: createProcess
  });

  // Assign reviewer to process (admin only)
  fastify.put('/:processId/assign', {
    preHandler: verifyToken,
    schema: {
      description: 'Asignar revisor a proceso',
      tags: ['Processes'],
      summary: 'Asignar revisor - Requiere rol: Administrador',
      security: [{ Bearer: [] }]
    },
    handler: assignReviewer
  });

  // Get available reviewers (admin only)
  fastify.get('/reviewers', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener lista de revisores disponibles',
      tags: ['Processes'],
      summary: 'Obtener revisores disponibles - Requiere rol: Administrador',
      security: [{ Bearer: [] }]
    },
    handler: getAvailableReviewers
  });
}

export default processRoutes;