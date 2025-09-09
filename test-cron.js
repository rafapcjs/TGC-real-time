import cron from 'node-cron';
import fetch from 'node-fetch';

console.log('Starting cron test...');

// Test cron job every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  try {
    console.log('Attempting to ping server...');
    const response = await fetch('http://localhost:3001/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Server ping successful at ${new Date().toISOString()}`);
      console.log('Response:', data);
    } else {
      console.log(`⚠ Server ping failed with status ${response.status} at ${new Date().toISOString()}`);
    }
  } catch (error) {
    console.log(`✗ Server ping error at ${new Date().toISOString()}:`, error.message);
  }
});

console.log('✓ Cron job configured to ping server every 30 seconds (test mode)');
console.log('Press Ctrl+C to stop...');

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\nStopping cron test...');
  process.exit(0);
});