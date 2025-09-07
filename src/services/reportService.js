import Incident from '../models/Incident.js';
import Process from '../models/Process.js';
import fs from 'fs';
import path from 'path';

export const generateReport = async (title, processIds) => {
  try {
    const processes = await Process.find({ _id: { $in: processIds } })
      .populate('assignedReviewer', 'name email')
      .populate('createdBy', 'name email');

    const incidents = await Incident.find({ processId: { $in: processIds } })
      .populate('processId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Create HTML report content
    const reportHtml = generateHtmlReport(title, processes, incidents);
    
    // For now, we'll save as HTML instead of PDF
    const filename = `report-${Date.now()}.html`;
    const filePath = path.join(process.cwd(), 'reports', filename);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, reportHtml);
    
    return {
      id: filename.replace('.html', ''),
      fileUrl: `/reports/${filename}`,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Error generating report');
  }
};

const generateHtmlReport = (title, processes, incidents) => {
  const incidentsByProcess = incidents.reduce((acc, incident) => {
    const processId = incident.processId._id.toString();
    if (!acc[processId]) {
      acc[processId] = [];
    }
    acc[processId].push(incident);
    return acc;
  }, {});

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .process { margin-bottom: 30px; border: 1px solid #ddd; padding: 20px; }
        .incident { margin: 10px 0; padding: 10px; background-color: #f9f9f9; }
        .status-pendiente { color: #e74c3c; }
        .status-resuelta { color: #27ae60; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generado el: ${new Date().toLocaleDateString('es-ES')}</p>
      </div>
      
      <h2>Resumen de Procesos</h2>
      <table>
        <tr>
          <th>Nombre del Proceso</th>
          <th>Estado</th>
          <th>Revisor Asignado</th>
          <th>Fecha de Vencimiento</th>
          <th>Total de Incidencias</th>
        </tr>
        ${processes.map(process => `
          <tr>
            <td>${process.name}</td>
            <td>${process.status}</td>
            <td>${process.assignedReviewer ? process.assignedReviewer.name : 'Sin asignar'}</td>
            <td>${process.dueDate ? new Date(process.dueDate).toLocaleDateString('es-ES') : 'Sin fecha límite'}</td>
            <td>${incidentsByProcess[process._id.toString()]?.length || 0}</td>
          </tr>
        `).join('')}
      </table>
      
      <h2>Detalle de Incidencias por Proceso</h2>
      ${processes.map(process => {
        const processIncidents = incidentsByProcess[process._id.toString()] || [];
        return `
          <div class="process">
            <h3>${process.name}</h3>
            <p><strong>Descripción:</strong> ${process.description || 'Sin descripción'}</p>
            <p><strong>Estado:</strong> ${process.status}</p>
            <p><strong>Total de incidencias:</strong> ${processIncidents.length}</p>
            
            ${processIncidents.length > 0 ? `
              <h4>Incidencias:</h4>
              ${processIncidents.map(incident => `
                <div class="incident">
                  <p><strong>Descripción:</strong> ${incident.description}</p>
                  <p><strong>Estado:</strong> <span class="status-${incident.status}">${incident.status}</span></p>
                  <p><strong>Creado por:</strong> ${incident.createdBy.name}</p>
                  <p><strong>Fecha de creación:</strong> ${new Date(incident.createdAt).toLocaleDateString('es-ES')}</p>
                  ${incident.resolvedAt ? `<p><strong>Fecha de resolución:</strong> ${new Date(incident.resolvedAt).toLocaleDateString('es-ES')}</p>` : ''}
                  ${incident.evidence && incident.evidence.length > 0 ? `
                    <p><strong>Evidencias:</strong></p>
                    <ul>
                      ${incident.evidence.map(url => `<li><a href="${url}" target="_blank">Ver evidencia</a></li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            ` : '<p>No hay incidencias registradas para este proceso.</p>'}
          </div>
        `;
      }).join('')}
      
      <div class="footer">
        <p>Reporte generado automáticamente por el sistema de gestión de incidencias</p>
      </div>
    </body>
    </html>
  `;
};