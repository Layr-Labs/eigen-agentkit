import { OpacityAdapter } from '../packages/adapter-opacity/src';
import { EigenDAAdapter } from '../packages/adapter-eigenda/src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  logId?: string;  // Store the EigenDA log ID
}

class VerifiableChatHistory {
  private opacity: OpacityAdapter;
  private eigenda: EigenDAAdapter;
  private history: ChatMessage[] = [];

  constructor() {
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
  }

  async initialize() {
    await this.eigenda.initialize();
    console.log('Chat history initialized');
  }

  async addUserMessage(content: string) {
    const message: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    this.history.push(message);

    // Log user message to EigenDA asynchronously
    this.eigenda.info('User message', {
      content,
      timestamp: message.timestamp,
    }).then(log => {
      message.logId = log.id;
      console.log(`User message logged with ID: ${log.id}`);
    });

    return message;
  }

  async generateResponse(prompt: string) {
    console.log('\nGenerating response...');
    
    // Create a context from history
    const context = this.history
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    // Generate response with proof and streaming
    const result = await this.opacity.generateText(
      `${context}\n\nUser: ${prompt}\nAssistant:`,
      {
        onProgress: (partial: string) => {
          process.stdout.write(partial);
        }
      }
    );

    console.log('\n\nVerifying response proof...');
    const isValid = await this.opacity.verifyProof(result.proof as any);
    if (!isValid) {
      console.warn('Warning: Response proof verification failed');
    }

    const message: ChatMessage = {
      role: 'assistant',
      content: result.content,
      timestamp: Date.now(),
    };

    this.history.push(message);

    // Log assistant message with proof to EigenDA asynchronously
    this.eigenda.info('Assistant message', {
      content: result.content,
      timestamp: message.timestamp,
      proof: result.proof,
      proofValid: isValid
    }).then(log => {
      message.logId = log.id;
      console.log(`Assistant message logged with ID: ${log.id}`);
    });

    return {
      message,
      proof: result.proof,
      proofValid: isValid
    };
  }

  async verifyMessageProof(proof: any) {  // Using any since we don't have the Proof type
    console.log('\nVerifying message proof...');
    const isValid = await this.opacity.verifyProof(proof);
    
    // Log verification result asynchronously
    this.eigenda.info('Proof verification', {
      isValid,
      timestamp: Date.now()
    }).then(log => {
      console.log(`Verification result logged with ID: ${log.id}`);
    });

    return isValid;
  }

  async getHistory() {
    return this.history;
  }

  async shutdown() {
    // Log shutdown asynchronously
    this.eigenda.info('Chat session ended', {
      messageCount: this.history.length,
      duration: Date.now() - (this.history[0]?.timestamp || Date.now())
    }).then(log => {
      console.log(`Session end logged with ID: ${log.id}`);
    });

    await this.eigenda.shutdown();
    console.log('Chat history shut down');
  }
}

async function main() {
  // Create a new chat session
  const chat = new VerifiableChatHistory();
  
  try {
    await chat.initialize();
    console.log('\nStarting chat session...');

    // First interaction
    console.log('\nUser: Hello! Can you help me learn about blockchain?');
    await chat.addUserMessage('Hello! Can you help me learn about blockchain?');
    
    const response1 = await chat.generateResponse('Hello! Can you help me learn about blockchain?');
    console.log('\nProof valid:', response1.proofValid);

    // Second interaction
    console.log('\nUser: What are smart contracts?');
    await chat.addUserMessage('What are smart contracts?');
    
    const response2 = await chat.generateResponse('What are smart contracts?');
    console.log('\nProof valid:', response2.proofValid);

    // Get chat history
    console.log('\nChat History:');
    const history = await chat.getHistory();
    history.forEach(msg => {
      console.log(`\n${msg.role.toUpperCase()} (${new Date(msg.timestamp).toISOString()})`);
      console.log(`Content: ${msg.content}`);
      if (msg.logId) {
        console.log(`Log ID: ${msg.logId}`);
      }
    });

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    await chat.shutdown();
  }
}

main(); 