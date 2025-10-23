import { createReport, getReport } from '../controllers/reportController.js';
import { verifyToken } from '../middlewares/auth.js';

async function reportRoutes(fastify, options) {
  // Create report and download directly
  fastify.post('/', {
    preHandler: verifyToken,
    schema: {
      description: 'Generar y descargar reporte PDF',
      tags: ['Reports'],
      summary: 'Crear reporte - Requiere rol: Cualquier usuario autenticado',
      security: [{ Bearer: [] }]
    },
    handler: createReport
  });

  // Get report metadata
  fastify.get('/:id', {
    preHandler: verifyToken,
    schema: {
      description: 'Obtener metadata de reporte existente',
      tags: ['Reports'],
      summary: 'Obtener reporte - Requiere rol: Cualquier usuario autenticado',
      security: [{ Bearer: [] }]
    },
    handler: getReport
  });
}

export default reportRoutes;