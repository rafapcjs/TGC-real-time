/**
 * Rutas para el health check del servidor
 * Utilizado por el cron job para mantener el servidor activo
 */

const healthRoutes = async (fastify) => {
  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });
};

export default healthRoutes;