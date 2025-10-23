import Incident from '../models/Incident.js';
import Process from '../models/Process.js';
import Report from '../models/Report.js';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';

export const generateReport = async (title, processIds, createdBy) => {
  let browser = null;
  
  try {
    console.log('Starting report generation for:', { title, processIds: processIds.length });
    
    // Fetch processes
    const processes = await Process.find({ _id: { $in: processIds } })
      .populate('assignedReviewer', 'name email')
      .populate('createdBy', 'name email');

    console.log('Found processes:', processes.length);

    if (processes.length === 0) {
      throw new Error('No processes found with the provided IDs');
    }

    // Fetch incidents
    const incidents = await Incident.find({ processId: { $in: processIds } })
      .populate('processId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log('Found incidents:', incidents.length);

    // Try Puppeteer first, fallback to PDFKit if it fails
    try {
      console.log('Attempting PDF generation with Puppeteer...');
      const pdfBuffer = await generatePDFWithPuppeteer(title, processes, incidents);
      
      // Generate filename for download
      const filename = `reporte-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save report metadata to database
      const report = new Report({
        title,
        fileUrl: null,
        filename,
        processIds,
        createdBy
      });
      
      await report.save();
      console.log('Report metadata saved to database');
      
      return {
        id: report._id,
        pdfBuffer,
        filename,
        generatedAt: report.createdAt
      };
    } catch (puppeteerError) {
      console.warn('Puppeteer failed, falling back to PDFKit:', puppeteerError.message);
      
      // Fallback to PDFKit
      console.log('Generating PDF with PDFKit fallback...');
      const pdfBuffer = await generatePDFWithPDFKit(title, processes, incidents);
      
      // Generate filename for download
      const filename = `reporte-${title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save report metadata to database
      const report = new Report({
        title,
        fileUrl: null,
        filename,
        processIds,
        createdBy
      });
      
      await report.save();
      console.log('Report metadata saved to database (PDFKit fallback)');
      
      return {
        id: report._id,
        pdfBuffer,
        filename,
        generatedAt: report.createdAt
      };
    }
  } catch (error) {
    console.error('Error generating report - Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Provide more specific error messages
    if (error.message.includes('No processes found')) {
      throw new Error('No processes found with the provided IDs');
    } else if (error.name === 'ValidationError') {
      throw new Error(`Database validation error: ${error.message}`);
    } else {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  } finally {
    // Always close browser if it was opened
    if (browser) {
      try {
        console.log('Closing browser...');
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
};

// Puppeteer PDF generation
const generatePDFWithPuppeteer = async (title, processes, incidents) => {
  let browser = null;
  
  try {
    // Create HTML report content
    const reportHtml = generateProfessionalHtmlReport(title, processes, incidents);
    
    // Configuration for production environments (like Render)
    const puppeteerConfig = {
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    };

    // For production environments, try to use system Chrome
    if (process.env.NODE_ENV === 'production') {
      try {
        // Try using system Chrome first
        puppeteerConfig.executablePath = '/usr/bin/google-chrome-stable';
      } catch (err) {
        console.log('System Chrome not found, falling back to bundled Chromium');
        // If system Chrome not available, try common paths
        const possiblePaths = [
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
          '/opt/google/chrome/chrome',
          '/usr/bin/google-chrome'
        ];
        
        for (const chromePath of possiblePaths) {
          try {
            if (require('fs').existsSync(chromePath)) {
              puppeteerConfig.executablePath = chromePath;
              break;
            }
          } catch (e) {
            // Continue to next path
          }
        }
      }
    }

    browser = await puppeteer.launch(puppeteerConfig);
    const page = await browser.newPage();
    
    await page.setContent(reportHtml, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      timeout: 30000
    });
    
    console.log('PDF generated successfully with Puppeteer, size:', pdfBuffer.length, 'bytes');
    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// PDFKit fallback PDF generation
const generatePDFWithPDFKit = async (title, processes, incidents) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        console.log('PDF generated successfully with PDFKit, size:', pdfBuffer.length, 'bytes');
        resolve(pdfBuffer);
      });
      
      // Header
      doc.fontSize(24).font('Helvetica-Bold');
      doc.text(title, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).font('Helvetica');
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });
      doc.moveDown(2);
      
      // Summary
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text('Resumen:', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12).font('Helvetica');
      doc.text(`• Total de procesos: ${processes.length}`);
      doc.text(`• Total de incidencias: ${incidents.length}`);
      doc.text(`• Incidencias pendientes: ${incidents.filter(i => i.status === 'pendiente').length}`);
      doc.text(`• Incidencias resueltas: ${incidents.filter(i => i.status === 'resuelta').length}`);
      doc.moveDown(2);
      
      // Processes details
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text('Detalle de Procesos:', { underline: true });
      doc.moveDown();
      
      processes.forEach((process, index) => {
        const processIncidents = incidents.filter(i => 
          i.processId._id.toString() === process._id.toString()
        );
        
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`${index + 1}. ${process.name}`);
        doc.moveDown(0.5);
        
        doc.fontSize(12).font('Helvetica');
        doc.text(`Estado: ${process.status}`);
        doc.text(`Revisor: ${process.assignedReviewer ? process.assignedReviewer.name : 'Sin asignar'}`);
        doc.text(`Incidencias: ${processIncidents.length}`);
        doc.moveDown();
        
        // Incidents for this process
        if (processIncidents.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Incidencias:');
          doc.moveDown(0.5);
          
          processIncidents.forEach((incident, incIndex) => {
            doc.fontSize(11).font('Helvetica');
            doc.text(`  ${incIndex + 1}. ${incident.description}`);
            doc.text(`     Estado: ${incident.status}`);
            doc.text(`     Creado por: ${incident.createdBy.name}`);
            doc.text(`     Fecha: ${new Date(incident.createdAt).toLocaleDateString('es-ES')}`);
            doc.moveDown(0.5);
          });
        }
        
        doc.moveDown();
        
        // Add page break if needed
        if (index < processes.length - 1 && doc.y > 700) {
          doc.addPage();
        }
      });
      
      // Footer
      doc.fontSize(10).font('Helvetica');
      doc.text('Reporte generado automáticamente por el Sistema de Gestión de Incidencias', 
        50, doc.page.height - 50, { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateProfessionalHtmlReport = (title, processes, incidents) => {
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: #fff;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
        }
        .header h1 { 
          font-size: 2.5em; 
          margin-bottom: 10px; 
          font-weight: 300;
        }
        .header p { 
          font-size: 1.1em; 
          opacity: 0.9;
        }
        .summary-stats {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
        }
        .stat-card {
          text-align: center;
          padding: 15px;
        }
        .stat-number {
          font-size: 2.5em;
          font-weight: bold;
          color: #667eea;
        }
        .stat-label {
          font-size: 0.9em;
          color: #666;
          margin-top: 5px;
        }
        h2 { 
          color: #2c3e50; 
          border-bottom: 3px solid #667eea; 
          padding-bottom: 10px; 
          margin: 30px 0 20px 0;
          font-size: 1.8em;
        }
        h3 { 
          color: #34495e; 
          margin: 20px 0 10px 0;
          font-size: 1.4em;
        }
        h4 { 
          color: #7f8c8d; 
          margin: 15px 0 10px 0;
          font-size: 1.2em;
        }
        .process { 
          margin-bottom: 30px; 
          border: 1px solid #e0e0e0; 
          padding: 25px; 
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          background: #fff;
        }
        .incident { 
          margin: 15px 0; 
          padding: 20px; 
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          border-radius: 8px;
        }
        .incident:nth-child(even) {
          background: #e8f4f8;
        }
        .status-pendiente { 
          color: #e74c3c; 
          font-weight: bold;
          background: #fee;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .status-resuelta { 
          color: #27ae60; 
          font-weight: bold;
          background: #efe;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .status-en-revision { 
          color: #f39c12; 
          font-weight: bold;
          background: #fff3cd;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .status-completado { 
          color: #27ae60; 
          font-weight: bold;
          background: #d4edda;
          padding: 4px 8px;
          border-radius: 4px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
          box-shadow: 0 2px 15px rgba(0,0,0,0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        th { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 12px;
          text-align: left;
          font-weight: 500;
        }
        td { 
          border-bottom: 1px solid #eee; 
          padding: 15px 12px; 
          background: #fff;
        }
        tr:hover td {
          background: #f8f9fa;
        }
        .footer {
          margin-top: 50px;
          padding: 20px;
          text-align: center;
          border-top: 2px solid #eee;
          color: #666;
          font-style: italic;
        }
        .evidence-list {
          margin: 10px 0;
        }
        .evidence-list li {
          margin: 5px 0;
        }
        .evidence-list a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
        .no-incidents {
          text-align: center;
          padding: 30px;
          color: #7f8c8d;
          font-style: italic;
          background: #f8f9fa;
          border-radius: 8px;
        }
        @media print {
          .header { break-inside: avoid; }
          .process { break-inside: avoid; }
          .incident { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>Generado el: ${new Date().toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>
      
      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-number">${processes.length}</div>
          <div class="stat-label">Procesos</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${incidents.length}</div>
          <div class="stat-label">Incidencias</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${incidents.filter(i => i.status === 'pendiente').length}</div>
          <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${incidents.filter(i => i.status === 'resuelta').length}</div>
          <div class="stat-label">Resueltas</div>
        </div>
      </div>
      
      <h2>📊 Resumen de Procesos</h2>
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
            <td><strong>${process.name}</strong></td>
            <td><span class="status-${process.status.replace(/\s/g, '-')}">${process.status}</span></td>
            <td>${process.assignedReviewer ? process.assignedReviewer.name : 'Sin asignar'}</td>
            <td>${process.dueDate ? new Date(process.dueDate).toLocaleDateString('es-ES') : 'Sin fecha límite'}</td>
            <td><strong>${incidentsByProcess[process._id.toString()]?.length || 0}</strong></td>
          </tr>
        `).join('')}
      </table>
      
      <h2>🔍 Detalle de Incidencias por Proceso</h2>
      ${processes.map(process => {
        const processIncidents = incidentsByProcess[process._id.toString()] || [];
        return `
          <div class="process">
            <h3>📋 ${process.name}</h3>
            <p><strong>Descripción:</strong> ${process.description || 'Sin descripción'}</p>
            <p><strong>Estado:</strong> <span class="status-${process.status.replace(/\s/g, '-')}">${process.status}</span></p>
            <p><strong>Total de incidencias:</strong> <strong>${processIncidents.length}</strong></p>
            
            ${processIncidents.length > 0 ? `
              <h4>Incidencias:</h4>
              ${processIncidents.map((incident, index) => `
                <div class="incident">
                  <p><strong>🔸 Incidencia #${index + 1}:</strong> ${incident.description}</p>
                  <p><strong>Estado:</strong> <span class="status-${incident.status}">${incident.status}</span></p>
                  <p><strong>Creado por:</strong> ${incident.createdBy.name}</p>
                  <p><strong>Fecha de creación:</strong> ${new Date(incident.createdAt).toLocaleDateString('es-ES')}</p>
                  ${incident.resolvedAt ? `<p><strong>Fecha de resolución:</strong> ${new Date(incident.resolvedAt).toLocaleDateString('es-ES')}</p>` : ''}
                  ${incident.evidence && incident.evidence.length > 0 ? `
                    <p><strong>📎 Evidencias (${incident.evidence.length}):</strong></p>
                    <ul class="evidence-list">
                      ${incident.evidence.map((url, i) => `<li><a href="${url}" target="_blank">📄 Evidencia ${i + 1}</a></li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('')}
            ` : '<div class="no-incidents">📝 No hay incidencias registradas para este proceso.</div>'}
          </div>
        `;
      }).join('')}
      
      <div class="footer">
        <p>📊 Reporte generado automáticamente por el Sistema de Gestión de Incidencias</p>
        <p>Fecha y hora de generación: ${new Date().toLocaleString('es-ES')}</p>
      </div>
    </body>
    </html>
  `;
};