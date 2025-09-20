import { generateReport } from '../services/reportService.js';
import Report from '../models/Report.js';

export const createReport = async (request, reply) => {
  try {
    const { title, processIds } = request.body;
    
    if (!title || !processIds || !Array.isArray(processIds)) {
      const error = new Error('Title y processIds son requeridos. processIds debe ser un array.');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (processIds.length === 0) {
      const error = new Error('Al menos un ID de proceso es requerido.');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      const error = new Error('Solo los revisores y supervisores pueden generar reportes');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    console.log('Generating report request:', {
      title,
      processIdsCount: processIds.length,
      userId: request.user.id,
      userRole: request.user.role
    });

    const report = await generateReport(title, processIds, request.user.id);
    
    console.log('Report generated successfully:', {
      reportId: report.id,
      filename: report.filename,
      bufferSize: report.pdfBuffer.length
    });
    
    // Enviar el PDF directamente al cliente para descarga
    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${report.filename}"`)
      .header('Content-Length', report.pdfBuffer.length)
      .send(report.pdfBuffer);
      
  } catch (error) {
    console.error('Error in createReport controller:', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      stack: error.stack
    });
    
    // Let the global error handler take care of the response
    throw error;
  }
};

export const getReport = async (request, reply) => {
  try {
    const { id } = request.params;

    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      const error = new Error('Solo los revisores y supervisores pueden ver reportes');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const report = await Report.findById(id);
    if (!report) {
      const error = new Error('Reporte no encontrado');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    console.log('Regenerating report for viewing:', {
      reportId: report._id,
      title: report.title,
      processIds: report.processIds,
      userId: request.user.id
    });

    // Regenerar el PDF con los mismos datos
    const regeneratedReport = await generateReport(report.title, report.processIds, report.createdBy);
    
    console.log('Report regenerated successfully for viewing:', {
      reportId: report._id,
      filename: regeneratedReport.filename,
      bufferSize: regeneratedReport.pdfBuffer.length
    });

    // Enviar el PDF directamente al cliente para descarga
    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${regeneratedReport.filename}"`)
      .header('Content-Length', regeneratedReport.pdfBuffer.length)
      .send(regeneratedReport.pdfBuffer);

  } catch (error) {
    console.error('Error in getReport controller:', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      stack: error.stack
    });
    
    // Let the global error handler take care of the response
    throw error;
  }
};

// Los métodos de descarga ya no son necesarios porque el PDF se envía directamente
// al cliente en el método createReport