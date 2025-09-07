import { generateReport } from '../services/reportService.js';

export const createReport = async (request, reply) => {
  try {
    const { title, processIds } = request.body;
    
    if (!title || !processIds || !Array.isArray(processIds)) {
      return reply.status(400).send({ 
        error: 'Title y processIds son requeridos. processIds debe ser un array.' 
      });
    }

    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ 
        error: 'Solo los revisores y supervisores pueden generar reportes' 
      });
    }

    const report = await generateReport(title, processIds);
    
    reply.status(201).send({
      id: report.id,
      fileUrl: report.fileUrl,
      generatedAt: report.generatedAt
    });
  } catch (error) {
    console.error('Error creating report:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};