import { EigenDAAdapter } from '@layr-labs/agentkit-eigenda';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Helper function to wait
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // Initialize the EigenDA adapter
  const eigenda = new EigenDAAdapter({
    privateKey: process.env.EIGENDA_PRIVATE_KEY!,
    apiUrl: process.env.EIGENDA_API_URL,
    rpcUrl: process.env.EIGENDA_BASE_RPC_URL,
    creditsContractAddress: process.env.EIGENDA_CREDITS_CONTRACT,
    // Don't wait for confirmation, we just need job IDs
    waitForConfirmation: false,
    // Flush every 5 seconds or when we have 3 logs
    flushInterval: 5000,
    maxBufferSize: 3
  });

  try {
    // Initialize the adapter
    await eigenda.initialize();
    console.log('EigenDA adapter initialized');

    console.log('\nCreating logs...');

    // Create logs asynchronously but keep the promises
    const infoPromise = eigenda.info('Application started', { version: '1.0.0' });
    console.log('Info log created');

    const warnPromise = eigenda.warn('High CPU usage', { cpu: 85 });
    console.log('Warning log created');

    const errorPromise = eigenda.error('Database connection failed', { 
      error: 'Connection timeout',
      retries: 3 
    });
    console.log('Error log created');

    const structuredPromise = eigenda.log({
      event: 'user_login',
      userId: '123',
      timestamp: new Date().toISOString(),
      success: true,
      details: {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        region: 'US-East'
      }
    }, {
      level: 'info',
      tags: ['auth', 'security']
    });
    console.log('Structured log created');

    // Set up handlers to show job IDs when they become available
    infoPromise.then(log => {
      console.log(`Info log ID: ${log.id}`);
    });

    warnPromise.then(log => {
      console.log(`Warning log ID: ${log.id}`);
    });

    errorPromise.then(log => {
      console.log(`Error log ID: ${log.id}`);
    });

    structuredPromise.then(log => {
      console.log(`Structured log ID: ${log.id}`);
    });

    // Wait for logs to be batched and job IDs to be available
    console.log('\nWaiting for logs to be batched...');
    await Promise.all([infoPromise, warnPromise, errorPromise, structuredPromise]);

    // Check balance
    console.log('\nChecking balance...');
    const balance = await eigenda.getBalance();
    console.log('Current balance:', balance);

    // Clean up
    await eigenda.shutdown();

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 