import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registerStaticRoutes = async (fastify) => {
  // Simple static file serving for reports
  fastify.get('/reports/:filename', async (request, reply) => {
    try {
      const filename = request.params.filename;
      const filePath = path.join(__dirname, '../..', 'reports', filename);
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath);
        reply.type('text/html').send(fileContent);
      } else {
        reply.status(404).send({ error: 'Archivo no encontrado' });
      }
    } catch (error) {
      reply.status(500).send({ error: 'Error al servir el archivo' });
    }
  });
};

export default registerStaticRoutes;
