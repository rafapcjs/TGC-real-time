import { generateReport } from '../services/reportService.js';
import Report from '../models/Report.js';

export const createReport = async (request, reply) => {
  try {
    const { title, processIds } = request.body;
    
    // Validate input
    if (!title || !processIds || !Array.isArray(processIds)) {
      return reply.status(400).send({ 
        error: 'Title y processIds son requeridos. processIds debe ser un array.' 
      });
    }

    if (processIds.length === 0) {
      return reply.status(400).send({ 
        error: 'Al menos un ID de proceso es requerido.' 
      });
    }

    // Check permissions
    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ 
        error: 'Solo los revisores y supervisores pueden generar reportes' 
      });
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
      bufferSize: report.pdfBuffer?.length || 0
    });
    
    // Send PDF directly to client for automatic download
    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${report.filename}"`)
      .header('Content-Length', report.pdfBuffer.length)
      .send(report.pdfBuffer);
      
  } catch (error) {
    console.error('Error in createReport controller:', {
      message: error.message,
      userId: request.user?.id,
      userRole: request.user?.role,
      stack: error.stack
    });
    
    // Send appropriate error response
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error interno del servidor';
    
    reply.status(statusCode).send({ error: message });
  }
};

export const getReport = async (request, reply) => {
  try {
    const { id } = request.params;

    // Check permissions
    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ 
        error: 'Solo los revisores y supervisores pueden ver reportes' 
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return reply.status(404).send({ 
        error: 'Reporte no encontrado' 
      });
    }

    console.log('Regenerating report for viewing:', {
      reportId: report._id,
      title: report.title,
      processIds: report.processIds,
      userId: request.user.id
    });

    // Regenerate PDF with same data
    const regeneratedReport = await generateReport(report.title, report.processIds, report.createdBy);
    
    console.log('Report regenerated successfully for viewing:', {
      reportId: report._id,
      filename: regeneratedReport.filename,
      bufferSize: regeneratedReport.pdfBuffer?.length || 0
    });

    // Send PDF directly to client for download
    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${regeneratedReport.filename}"`)
      .header('Content-Length', regeneratedReport.pdfBuffer.length)
      .send(regeneratedReport.pdfBuffer);

  } catch (error) {
    console.error('Error in getReport controller:', {
      message: error.message,
      userId: request.user?.id,
      userRole: request.user?.role,
      stack: error.stack
    });
    
    // Send appropriate error response
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error interno del servidor';
    
    reply.status(statusCode).send({ error: message });
  }
};

// Download PDF for specific report
export const downloadReport = async (request, reply) => {
  try {
    const { id } = request.params;

    // Check permissions
    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ 
        error: 'Solo los revisores y supervisores pueden descargar reportes' 
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return reply.status(404).send({ 
        error: 'Reporte no encontrado' 
      });
    }

    console.log('Downloading report:', {
      reportId: report._id,
      title: report.title,
      userId: request.user.id
    });

    // Regenerate PDF for download
    const regeneratedReport = await generateReport(report.title, report.processIds, report.createdBy);
    
    console.log('Report ready for download:', {
      reportId: report._id,
      filename: regeneratedReport.filename,
      bufferSize: regeneratedReport.pdfBuffer?.length || 0
    });

    // Send PDF directly to client for download
    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${regeneratedReport.filename}"`)
      .header('Content-Length', regeneratedReport.pdfBuffer.length)
      .send(regeneratedReport.pdfBuffer);

  } catch (error) {
    console.error('Error in downloadReport controller:', {
      message: error.message,
      userId: request.user?.id,
      userRole: request.user?.role,
      stack: error.stack
    });
    
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

// Get list of reports for reviewers and supervisors
export const getReports = async (request, reply) => {
  try {
    // Check permissions
    if (request.user.role !== 'revisor' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ 
        error: 'Solo los revisores y supervisores pueden ver reportes' 
      });
    }

    // Filter reports based on role
    let filter = {};
    if (request.user.role === 'revisor') {
      filter = { createdBy: request.user.id };
    }

    const reports = await Report.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const formattedReports = reports.map(report => ({
      id: report._id,
      title: report.title,
      filename: report.filename,
      processCount: report.processIds.length,
      createdBy: report.createdBy,
      createdAt: report.createdAt
    }));

    reply.send(formattedReports);

  } catch (error) {
    console.error('Error in getReports controller:', {
      message: error.message,
      userId: request.user?.id,
      userRole: request.user?.role,
      stack: error.stack
    });
    
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

// Los métodos de descarga ya no son necesarios porque el PDF se envía directamente
// al cliente en el método createReport