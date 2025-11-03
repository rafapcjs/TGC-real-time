import { 
  getReviewerProcesses, 
  getSupervisorProcesses, 
  createProcess, 
  assignReviewer,
  getAvailableReviewers,
  getAllProcesses,
  getProcessById,
  updateProcess,
  deleteProcess,
  getProcessesByStatus,
  getProcessStatistics
} from '../controllers/processController.js';
import { verifyToken } from '../middlewares/auth.js';
import {
  createProcessSchema,
  updateProcessSchema,
  assignReviewerSchema,
  processParamsSchema,
  statusParamsSchema
} from '../schemas/processSchemas.js';

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
      security: [{ Bearer: [] }],
      body: createProcessSchema
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
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        properties: {
          processId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
        },
        required: ['processId']
      },
      body: assignReviewerSchema
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

  // CRUD ENDPOINTS

  // Get all processes (role-based access)
  fastify.get('/', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener todos los procesos según el rol del usuario',
      tags: ['Processes'],
      summary: 'Obtener procesos - Admin/Supervisor: todos, Revisor: asignados',
      security: [{ Bearer: [] }]
    },
    handler: getAllProcesses
  });

  // Get single process by ID
  fastify.get('/:id', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener proceso específico por ID',
      tags: ['Processes'],
      summary: 'Obtener proceso por ID - Permisos según rol',
      security: [{ Bearer: [] }],
      params: processParamsSchema
    },
    handler: getProcessById
  });

  // Update process
  fastify.put('/:id', {
    preHandler: verifyToken,
    schema: {
      description: 'Actualizar proceso',
      tags: ['Processes'],
      summary: 'Actualizar proceso - Permisos según rol',
      security: [{ Bearer: [] }],
      params: processParamsSchema,
      body: updateProcessSchema
    },
    handler: updateProcess
  });

  // Delete process (admin only)
  fastify.delete('/:id', {
    preHandler: verifyToken,
    schema: {
      description: 'Eliminar proceso',
      tags: ['Processes'],
      summary: 'Eliminar proceso - Requiere rol: Administrador',
      security: [{ Bearer: [] }],
      params: processParamsSchema
    },
    handler: deleteProcess
  });

  // Get processes by status
  fastify.get('/status/:status', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener procesos por estado',
      tags: ['Processes'],
      summary: 'Obtener procesos por estado - Permisos según rol',
      security: [{ Bearer: [] }],
      params: statusParamsSchema
    },
    handler: getProcessesByStatus
  });

  // Get process statistics (admin/supervisor only)
  fastify.get('/stats/overview', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener estadísticas de procesos',
      tags: ['Processes'],
      summary: 'Obtener estadísticas - Requiere rol: Administrador o Supervisor',
      security: [{ Bearer: [] }]
    },
    handler: getProcessStatistics
  });
}

export default processRoutes;