import { OpacityAdapter } from '../packages/adapter-opacity/src';
import { EigenDAAdapter } from '../packages/adapter-eigenda/src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class ResilientService {
  private opacity: OpacityAdapter;
  private eigenda: EigenDAAdapter;
  private isInitialized = false;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(retryAttempts = 3, retryDelay = 1000) {
    // Initialize Opacity adapter with streaming support
    this.opacity = new OpacityAdapter({
      teamId: process.env.OPACITY_TEAM_ID!,
      teamName: process.env.OPACITY_TEAM_NAME!,
      apiKey: process.env.OPACITY_API_KEY!,
      opacityProverUrl: process.env.OPACITY_PROVER_URL!
    });

    // Initialize EigenDA adapter with batching configuration
    this.eigenda = new EigenDAAdapter({
      privateKey: process.env.EIGENDA_PRIVATE_KEY!,
      apiUrl: process.env.EIGENDA_API_URL,
      rpcUrl: process.env.EIGENDA_BASE_RPC_URL,
      creditsContractAddress: process.env.EIGENDA_CREDITS_CONTRACT,
      waitForConfirmation: false,
      flushInterval: 5000,
      maxBufferSize: 3
    });

    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
  }

  private async retry<T>(
    operation: () => Promise<T>,
    context: string,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      
      // Log error to EigenDA if initialized
      if (this.isInitialized) {
        try {
          // Log errors asynchronously
          this.eigenda.error(`Operation failed: ${context}`, {
            error,
            attempt,
            context,
          }).then(log => {
            console.log(`Error logged with ID: ${log.id}`);
          });
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
      }

      if (attempt >= this.retryAttempts) {
        throw new Error(`${context} failed after ${attempt} attempts: ${error}`);
      }

      console.log(`Retrying ${context} (attempt ${attempt + 1}/${this.retryAttempts})...`);

      // Wait before retrying (exponential backoff)
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry the operation
      return this.retry(operation, context, attempt + 1);
    }
  }

  async initialize() {
    try {
      await this.eigenda.initialize();
      this.isInitialized = true;
      
      // Log initialization asynchronously
      this.eigenda.info('Service initialized successfully')
        .then(log => {
          console.log(`Initialization logged with ID: ${log.id}`);
        });
    } catch (error) {
      console.error('Failed to initialize EigenDA:', error);
      throw error;
    }
  }

  async generateWithFallback(prompt: string) {
    return this.retry(
      async () => {
        console.log('\nGenerating text...');
        
        // Use streaming for real-time feedback
        const result = await this.opacity.generateText(prompt, {
          onProgress: (partial: string) => {
            process.stdout.write(partial);
          }
        });
        
        console.log('\nVerifying proof...');
        
        // Verify the proof immediately
        const isValid = await this.opacity.verifyProof(result.proof);
        if (!isValid) {
          throw new Error('Generated proof verification failed');
        }

        // Log successful generation asynchronously
        this.eigenda.info('Generation successful', {
          prompt,
          hasValidProof: isValid,
        }).then(log => {
          console.log(`Generation success logged with ID: ${log.id}`);
        });

        return result;
      },
      'Text generation'
    );
  }

  async verifyWithRetry(proof: any) {
    return this.retry(
      async () => {
        console.log('Verifying proof...');
        const isValid = await this.opacity.verifyProof(proof);
        
        // Log verification result asynchronously
        this.eigenda.info('Proof verification', {
          isValid,
          timestamp: Date.now(),
        }).then(log => {
          console.log(`Verification result logged with ID: ${log.id}`);
        });

        return isValid;
      },
      'Proof verification'
    );
  }

  async logWithRetry(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) {
    return this.retry(
      async () => {
        let logPromise;
        switch (level) {
          case 'info':
            logPromise = this.eigenda.info(message, metadata);
            break;
          case 'warn':
            logPromise = this.eigenda.warn(message, metadata);
            break;
          case 'error':
            logPromise = this.eigenda.error(message, metadata);
            break;
        }
        
        // Handle the log result asynchronously
        logPromise.then(log => {
          console.log(`Message logged with ID: ${log.id}`);
        });

        return logPromise;
      },
      'Logging operation'
    );
  }

  async shutdown() {
    if (this.isInitialized) {
      try {
        // Log shutdown asynchronously
        this.eigenda.info('Service shutting down')
          .then(log => {
            console.log(`Shutdown logged with ID: ${log.id}`);
          });
        
        await this.eigenda.shutdown();
        console.log('Service shut down successfully');
      } catch (error) {
        console.error('Error during shutdown:', error);
      }
    }
  }
}

async function main() {
  const service = new ResilientService();

  try {
    // Initialize with error handling
    console.log('Initializing service...');
    await service.initialize();

    // Example 1: Handling generation errors
    console.log('\nExample 1: Handling generation errors');
    try {
      const result = await service.generateWithFallback(
        'What is the meaning of life?'
      );
      console.log('\nGeneration successful');
      console.log('Has valid proof:', !!result.proof);
    } catch (error) {
      console.error('Generation failed:', error);
    }

    // Example 2: Handling verification errors
    console.log('\nExample 2: Handling verification errors');
    try {
      const result = await service.generateWithFallback(
        'Tell me a joke'
      );
      const isValid = await service.verifyWithRetry(result.proof);
      console.log('Proof is valid:', isValid);
    } catch (error) {
      console.error('Verification failed:', error);
    }

    // Example 3: Handling logging errors
    console.log('\nExample 3: Handling logging errors');
    try {
      await service.logWithRetry('info', 'Test log message', {
        test: true,
        timestamp: Date.now(),
      });
      console.log('Log operation completed');
    } catch (error) {
      console.error('Logging failed:', error);
    }

    // Example 4: Simulating and handling network errors
    console.log('\nExample 4: Handling network errors');
    try {
      // Simulate a network error by passing an invalid prompt
      await service.generateWithFallback('');
    } catch (error) {
      console.error('Expected error occurred:', error instanceof Error ? error.message : String(error));
    }

  } catch (error) {
    console.error('Service error:', error);
  } finally {
    await service.shutdown();
  }
}

main(); 