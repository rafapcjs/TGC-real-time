/**
 * Archivo para centralizar la configuración de la aplicación
 * Facilita el acceso y modificación de la configuración en un solo lugar
 */

const config = {
  server: {
    port: parseInt(process.env.PORT) || 3001,
    host: '0.0.0.0',
  },
  cors: {
    allowedOrigins: process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL || 'https://your-frontend-domain.com',
          'https://tgc-real-time.onrender.com'
        ]
      : ['http://localhost:5173']
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tcc'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret_key_for_development',
    expiresIn: '1d'
  },
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
  }
};

export default config;
