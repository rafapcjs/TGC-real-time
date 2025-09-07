import createServer from './config/server.js';
import connectDB from './config/database.js';
import registerPlugins from './plugins/fastifyPlugins.js';
import registerStaticRoutes from './plugins/staticFiles.js';
import registerRoutes from './plugins/routes.js';
import seedInitialData from './seeders/initialSeeder.js';
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
    
    // Auto-seed initial data in development
    if (process.env.NODE_ENV !== 'production') {
      await seedInitialData();
    }
    
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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Iniciar servidor
start();