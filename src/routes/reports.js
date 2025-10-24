import { createReport, getReport, getReports, downloadReport } from '../controllers/reportController.js';
import { verifyToken } from '../middlewares/auth.js';

async function reportRoutes(fastify, options) {
  // Get list of reports
  fastify.get('/', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener lista de reportes',
      tags: ['Reports'],
      summary: 'Listar reportes - Requiere rol: Revisor o Supervisor',
      security: [{ Bearer: [] }]
    },
    handler: getReports
  });

  // Create report and download directly
  fastify.post('/', {
    preHandler: verifyToken,
    schema: {
      description: 'Generar y descargar reporte PDF',
      tags: ['Reports'],
      summary: 'Crear reporte - Requiere rol: Revisor o Supervisor',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['title', 'processIds'],
        properties: {
          title: { type: 'string', description: 'Título del reporte' },
          processIds: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Array de IDs de procesos' 
          }
        }
      }
    },
    handler: createReport
  });

  // Get report metadata
  fastify.get('/:id', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener metadatos del reporte',
      tags: ['Reports'],
      summary: 'Obtener info del reporte - Requiere rol: Revisor o Supervisor',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID del reporte' }
        }
      }
    },
    handler: getReport
  });

  // Download PDF report
  fastify.get('/:id/download', {
    preHandler: verifyToken,
    schema: {
      description: 'Descargar reporte PDF',
      tags: ['Reports'],
      summary: 'Descargar PDF - Requiere rol: Revisor o Supervisor',
      security: [{ Bearer: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID del reporte' }
        }
      }
    },
    handler: downloadReport
  });
}

export default reportRoutes;