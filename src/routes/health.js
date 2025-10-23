/**
 * Rutas para el health check del servidor
 * Utilizado por el cron job para mantener el servidor activo
 */

const healthRoutes = async (fastify) => {
  // Health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'Verificar el estado de salud del servidor',
      tags: ['Health'],
      summary: 'Health Check - Acceso público (sin autenticación)',
      response: {
        200: {
          description: 'Servidor funcionando correctamente',
          type: 'object',
          properties: {
            status: { 
              type: 'string',
              description: 'Estado del servidor'
            },
            timestamp: { 
              type: 'string',
              format: 'date-time',
              description: 'Timestamp de la respuesta'
            },
            uptime: { 
              type: 'number',
              description: 'Tiempo de actividad del servidor en segundos'
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });
};

export default healthRoutes;