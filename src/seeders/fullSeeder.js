import User from '../models/User.js';
import Process from '../models/Process.js';
import Incident from '../models/Incident.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const seedDatabase = async (closeConnectionAfter = false) => {
  const session = await mongoose.startSession();
  
  try {
    // Check if any of our seeded users already exist (before starting transaction)
    const existingUsers = await User.find({ 
      email: { 
        $in: ['admin@empresa.com', 'maria.revisor@empresa.com', 'juan.supervisor@empresa.com'] 
      } 
    });
    
    if (existingUsers.length > 0) {
      console.log('Data already seeded, skipping...');
      await session.endSession();
      return;
    }
    
    // Start transaction after confirming we need to seed
    await session.startTransaction();
    
    console.log('Seeding data...');
    
    // 1. Create Users (3 inserts)
    const salt = await bcrypt.genSalt(10);
    const users = [
      {
        name: 'Carlos Admin',
        email: 'admin@empresa.com',
        password: await bcrypt.hash('admin123456', salt),
        role: 'administrador'
      },
      {
        name: 'María Revisora',
        email: 'maria.revisor@empresa.com',
        password: await bcrypt.hash('revisor123', salt),
        role: 'revisor'
      },
      {
        name: 'Juan Supervisor',
        email: 'juan.supervisor@empresa.com',
        password: await bcrypt.hash('supervisor123', salt),
        role: 'supervisor'
      }
    ];
    
    const createdUsers = await User.insertMany(users, { session });
    console.log('✓ 3 usuarios creados');
    
    // 2. Create Processes (4 inserts)
    const processes = [
      {
        name: 'Proceso de Contabilidad General',
        description: 'Registro y control de movimientos contables mensuales',
        status: 'en revisión',
        assignedReviewer: createdUsers[1]._id, // María Revisora
        dueDate: new Date('2025-10-15'),
        createdBy: createdUsers[0]._id // Carlos Admin
      },
      {
        name: 'Auditoría de Inventarios',
        description: 'Verificación física y documental de inventarios',
        status: 'pendiente',
        dueDate: new Date('2025-09-30'),
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Control de Gastos Operativos',
        description: 'Revisión de gastos del mes anterior',
        status: 'completado',
        assignedReviewer: createdUsers[1]._id,
        dueDate: new Date('2025-09-01'),
        createdBy: createdUsers[0]._id
      },
      {
        name: 'Reconciliación Bancaria',
        description: 'Conciliación de cuentas bancarias principales',
        status: 'en revisión',
        assignedReviewer: createdUsers[1]._id,
        dueDate: new Date('2025-09-25'),
        createdBy: createdUsers[0]._id
      }
    ];
    
    const createdProcesses = await Process.insertMany(processes, { session });
    console.log('✓ 4 procesos creados');
    
    // 3. Create Incidents (3 inserts)
    const incidents = [
      {
        processId: createdProcesses[0]._id,
        description: 'Discrepancia encontrada en el balance de caja chica por $150.000',
        status: 'pendiente',
        evidence: [
          'https://res.cloudinary.com/example/evidence1.jpg',
          'https://res.cloudinary.com/example/evidence2.pdf'
        ],
        createdBy: createdUsers[1]._id
      },
      {
        processId: createdProcesses[1]._id,
        description: 'Faltante de 5 unidades en inventario de productos terminados',
        status: 'resuelta',
        evidence: ['https://res.cloudinary.com/example/inventory_report.xlsx'],
        createdBy: createdUsers[1]._id,
        resolvedAt: new Date('2025-09-05T10:30:00.000Z')
      },
      {
        processId: createdProcesses[3]._id,
        description: 'Error en registro de transferencia bancaria - duplicación de movimiento',
        status: 'pendiente',
        evidence: [
          'https://res.cloudinary.com/example/bank_statement.pdf',
          'https://res.cloudinary.com/example/transfer_voucher.jpg'
        ],
        createdBy: createdUsers[1]._id
      }
    ];
    
    const createdIncidents = await Incident.insertMany(incidents, { session });
    console.log('✓ 3 incidencias creadas');
    
    await session.commitTransaction();
    
    // 4. Crear Reporte de ejemplo
    const { default: Report } = await import('../models/Report.js');
    const report = {
      title: 'Reporte Mensual de Supervisión',
      fileUrl: 'https://tgc-real-time.onrender.com/reports/report-1725724800000.html',
      filename: 'report-1725724800000.html',
      processIds: [createdProcesses[0]._id, createdProcesses[3]._id],
      createdBy: createdUsers[2]._id // Juan Supervisor
    };
    const createdReport = await Report.create([report], { session });
    console.log('✓ 1 reporte creado');

    // Summary
    console.log('\n=== RESUMEN DE DATOS CREADOS ===');
    console.log(`Total de inserts realizados: 11`);
    console.log(`- Usuarios: ${createdUsers.length}`);
    console.log(`- Procesos: ${createdProcesses.length}`);
    console.log(`- Incidencias: ${createdIncidents.length}`);
    console.log(`- Reportes: ${createdReport.length}`);

    console.log('\n=== CREDENCIALES DE ACCESO ===');
    console.log('Admin:');
    console.log('  Email: admin@empresa.com');
    console.log('  Password: admin123456');
    console.log('\nRevisor:');
    console.log('  Email: maria.revisor@empresa.com');
    console.log('  Password: revisor123');
    console.log('\nSupervisor:');
    console.log('  Email: juan.supervisor@empresa.com');
    console.log('  Password: supervisor123');
    
  } catch (error) {
    // Abort transaction if it was started  
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortError) {
      console.error('Error aborting transaction:', abortError);
    }
    console.error('Error al poblar la base de datos:', error);
    throw error;
  } finally {
    // Always end session if it exists
    try {
      if (session) {
        await session.endSession();
      }
    } catch (sessionError) {
      console.error('Error ending session:', sessionError);
    }
    
    // Close connection if requested
    if (closeConnectionAfter && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.close();
        console.log('Database connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
};

export default seedDatabase;

// Main execution function
const runSeeder = async () => {
  let connectionAttempted = false;
  
  try {
    // Ensure environment variables are loaded
    const { default: dotenv } = await import('dotenv');
    dotenv.config();
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    console.log('Connecting to database...');
    const { default: connectDB } = await import('../config/database.js');
    await connectDB();
    connectionAttempted = true;
    console.log('Database connected successfully');
    
    await seedDatabase(false); // Don't close here, we'll handle it below
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    // Always close connection when running directly via runSeeder
    if (connectionAttempted) {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          console.log('Database connection closed');
        }
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
    process.exit(0);
  }
};

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeder();
}