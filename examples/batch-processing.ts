import { OpacityAdapter } from '@layr-labs/agentkit-opacity';
import { EigenDAAdapter } from '@layr-labs/agentkit-eigenda';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Task {
  id: string;
  prompt: string;
  metadata?: Record<string, unknown>;
}

interface TaskResult {
  taskId: string;
  content: string;
  proof: unknown;
  timestamp: number;
  metadata?: Record<string, unknown>;
  logId?: string;  // Store the EigenDA log ID
}

class BatchProcessor {
  private opacity: OpacityAdapter;
  private eigenda: EigenDAAdapter;
  private results: Map<string, TaskResult> = new Map();
  private batchSize: number;
  private retryAttempts: number;

  constructor(batchSize = 3, retryAttempts = 3) {
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

    this.batchSize = batchSize;
    this.retryAttempts = retryAttempts;
  }

  async initialize() {
    await this.eigenda.initialize();
    console.log('Batch processor initialized');
  }

  private async processTask(task: Task, attempt = 1): Promise<TaskResult | null> {
    try {
      console.log(`\nProcessing task ${task.id} (attempt ${attempt}/${this.retryAttempts})...`);
      console.log('Prompt:', task.prompt);

      // Generate result with proof and streaming
      const result = await this.opacity.generateText(task.prompt, {
        onProgress: (partial: string) => {
          process.stdout.write(partial);
        }
      });

      console.log('\nVerifying proof...');
      const isValid = await this.opacity.verifyProof(result.proof);
      if (!isValid) {
        throw new Error('Proof verification failed');
      }

      const taskResult: TaskResult = {
        taskId: task.id,
        content: result.content,
        proof: result.proof,
        timestamp: Date.now(),
        metadata: {
          ...task.metadata,
          proofValid: isValid,
          attempt
        }
      };

      // Log success to EigenDA asynchronously
      this.eigenda.info(`Task completed: ${task.id}`, {
        task,
        result: taskResult,
        attempt,
      }).then(log => {
        taskResult.logId = log.id;
        console.log(`Task ${task.id} logged with ID: ${log.id}`);
      });

      return taskResult;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`\nTask ${task.id} failed:`, error);

      // Log error to EigenDA asynchronously
      this.eigenda.error(`Task failed: ${task.id}`, {
        task,
        error,
        attempt,
      }).then(log => {
        console.log(`Error logged with ID: ${log.id}`);
      });

      if (attempt < this.retryAttempts) {
        console.log(`Retrying task ${task.id} in ${Math.pow(2, attempt)} seconds...`);
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processTask(task, attempt + 1);
      }

      return null;
    }
  }

  async processBatch(tasks: Task[]) {
    const totalBatches = Math.ceil(tasks.length / this.batchSize);
    
    // Process tasks in batches
    for (let i = 0; i < tasks.length; i += this.batchSize) {
      const batch = tasks.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      
      console.log(`\nProcessing batch ${batchNumber}/${totalBatches}...`);

      // Process batch in parallel
      const results = await Promise.all(
        batch.map(task => this.processTask(task))
      );

      // Store successful results
      results.forEach((result, index) => {
        if (result) {
          if (batch[index]?.id) {
            this.results.set(batch[index].id, result);
          }
        }
      });

      // Log batch completion asynchronously
      this.eigenda.info(`Batch ${batchNumber} completed`, {
        batchNumber,
        totalBatches,
        successCount: results.filter(r => r !== null).length,
        failureCount: results.filter(r => r === null).length,
      }).then(log => {
        console.log(`Batch ${batchNumber} completion logged with ID: ${log.id}`);
      });

      // Show batch summary
      console.log(`\nBatch ${batchNumber} summary:`);
      console.log(`- Successful tasks: ${results.filter(r => r !== null).length}`);
      console.log(`- Failed tasks: ${results.filter(r => r === null).length}`);
    }
  }

  async verifyResult(taskId: string): Promise<boolean> {
    const result = this.results.get(taskId);
    if (!result) return false;

    console.log(`Verifying result for task ${taskId}...`);
    const isValid = await this.opacity.verifyProof(result.proof as any);  // Using any since we don't have the Proof type
    
    // Log verification asynchronously
    this.eigenda.info(`Result verification for task ${taskId}`, {
      taskId,
      isValid,
      logId: result.logId
    }).then(log => {
      console.log(`Verification logged with ID: ${log.id}`);
    });

    return isValid;
  }

  async getResults() {
    return Array.from(this.results.values());
  }

  async shutdown() {
    // Log shutdown asynchronously
    this.eigenda.info('Batch processor shutting down', {
      processedTasks: this.results.size
    }).then(log => {
      console.log(`Shutdown logged with ID: ${log.id}`);
    });

    await this.eigenda.shutdown();
    console.log('Batch processor shut down');
  }
}

async function main() {
  // Example tasks: Translate sentences to different languages
  const tasks: Task[] = [
    {
      id: '1',
      prompt: 'Translate to French: "Hello, how are you?"',
      metadata: { targetLanguage: 'French' },
    },
    {
      id: '2',
      prompt: 'Translate to Spanish: "I love programming"',
      metadata: { targetLanguage: 'Spanish' },
    },
    {
      id: '3',
      prompt: 'Translate to German: "The weather is nice"',
      metadata: { targetLanguage: 'German' },
    },
    {
      id: '4',
      prompt: 'Translate to Italian: "See you tomorrow"',
      metadata: { targetLanguage: 'Italian' },
    },
    {
      id: '5',
      prompt: 'Translate to Portuguese: "Good night"',
      metadata: { targetLanguage: 'Portuguese' },
    },
  ];

  const processor = new BatchProcessor(2); // Process 2 tasks at a time
  
  try {
    await processor.initialize();
    console.log('\nStarting batch processing...');
    await processor.processBatch(tasks);

    // Verify and display results
    const results = await processor.getResults();
    console.log('\nFinal Results:');
    
    for (const result of results) {
      const isValid = await processor.verifyResult(result.taskId);
      console.log(`\nTask ${result.taskId}:`);
      console.log('Content:', result.content);
      console.log('Proof valid:', isValid);
      console.log('Log ID:', result.logId);
      if (result.metadata) {
        console.log('Metadata:', result.metadata);
      }
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await processor.shutdown();
  }
}

main(); 