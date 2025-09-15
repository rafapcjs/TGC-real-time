import { generateReport } from '../services/reportService.js';
import Report from '../models/Report.js';
import path from 'path';
import fs from 'fs';

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

    const report = await generateReport(title, processIds, request.user.id);
    
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

export const getReport = async (request, reply) => {
  try {
    const { id } = request.params;

    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ error: 'Solo los revisores y supervisores pueden ver reportes' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return reply.status(404).send({ error: 'Reporte no encontrado' });
    }

    reply.send({
      id: report._id,
      fileUrl: report.fileUrl,
      generatedAt: report.createdAt
    });
  } catch (error) {
    console.error('Error getting report:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const downloadReport = async (request, reply) => {
  try {
    const { id } = request.params;

    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ error: 'Solo los revisores y supervisores pueden descargar reportes' });
    }

    const report = await Report.findById(id);
    if (!report) {
      return reply.status(404).send({ error: 'Reporte no encontrado' });
    }

    const filePath = path.join(process.cwd(), 'reports', report.filename);
    
    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Archivo de reporte no encontrado' });
    }

    const filename = `reporte-${report.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(fs.createReadStream(filePath));
      
  } catch (error) {
    console.error('Error downloading report:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};