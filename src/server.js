import createServer from './config/server.js';
import connectDB from './config/database.js';
import registerPlugins from './plugins/fastifyPlugins.js';
import registerStaticRoutes from './plugins/staticFiles.js';
import registerRoutes from './plugins/routes.js';
import seedInitialData from './seeders/initialSeeder.js';
import cron from 'node-cron';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Crear instancia del servidor
const fastify = createServer();

/**
 * Inicia el servidor y configura todos los componentes necesarios
 */
const start = async () => {
  try {
    // Conexión a la base de datos
    await connectDB();
    
    // Auto-seed initial data (in all environments)
    await seedInitialData();
    
    // Registrar plugins (cors, jwt, multipart)
    await registerPlugins(fastify);
    
    // Configurar rutas de archivos estáticos
    await registerStaticRoutes(fastify);
    
    // Registrar las rutas API
    await registerRoutes(fastify);
    
    // Obtener configuración del servidor
    const config = await import('./config/appConfig.js');
    const serverConfig = config.default.server;
    
    // Iniciar el servidor
    await fastify.listen({ 
      port: serverConfig.port, 
      host: serverConfig.host 
    });
    
    console.log(`Server is running on port ${serverConfig.port}`);
    console.log(`Server host: ${serverConfig.host}`);
    console.log(`Server URL: http://${serverConfig.host}:${serverConfig.port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`PORT from env: ${process.env.PORT}`);
    console.log(`Running on Render: ${!!process.env.RENDER}`);
    
    // Keep the process alive
    process.stdin.resume();
    
    // Configurar cron job para ping cada 10 minutos (en producción o en Render)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
    if (isProduction) {
      const serverUrl = process.env.SERVER_URL || `https://tgc-real-time.onrender.com`;
      
      cron.schedule('*/10 * * * *', async () => {
        try {
          const response = await fetch(`${serverUrl}/health`);
          if (response.ok) {
            console.log(`✓ Server ping successful at ${new Date().toISOString()}`);
          } else {
            console.log(`⚠ Server ping failed with status ${response.status} at ${new Date().toISOString()}`);
          }
        } catch (error) {
          console.log(`✗ Server ping error at ${new Date().toISOString()}:`, error.message);
        }
      });
      
      console.log('✓ Cron job configured to ping server every 10 minutes');
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  fastify.log.error('Unhandled Promise Rejection:', err);
  // Don't exit the process
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  fastify.log.error('Uncaught Exception:', err);
  // Don't exit the process immediately
});

// Iniciar servidor
start();