import { OpacityAdapter } from '../packages/adapter-opacity/src';
import { EigenDAAdapter } from '../packages/adapter-eigenda/src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface AgentAction {
  type: 'observe' | 'think' | 'act';
  input?: unknown;
  output?: unknown;
  timestamp: number;
}

class MonitoredAgent {
  private opacity: OpacityAdapter;
  private eigenda: EigenDAAdapter;
  private actions: AgentAction[] = [];

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
    this.logAction('observe', 'Agent initialized');
    console.log('Agent initialized');
  }

  private logAction(type: AgentAction['type'], input?: unknown, output?: unknown) {
    const action: AgentAction = {
      type,
      input,
      output,
      timestamp: Date.now(),
    };

    this.actions.push(action);

    // Log to EigenDA asynchronously with appropriate level
    const level = type === 'act' ? 'warn' : 'info';
    const logPromise = this.eigenda.log(action, {
      level,
      tags: ['agent', type],
      metadata: {
        actionCount: this.actions.length,
      },
    });

    // Handle job ID when available
    logPromise.then(log => {
      console.log(`Action logged with ID: ${log.id}`);
    });

    return action;
  }

  async observe(data: unknown) {
    this.logAction('observe', data);
    return data;
  }

  async think(problem: string) {
    console.log('\nThinking about the problem...');
    
    // Use Opacity for verifiable thinking with streaming
    const result = await this.opacity.generateText(
      `Given the problem: "${problem}", think step by step about how to solve it.`,
      {
        onProgress: (partial: string) => {
          process.stdout.write(partial);
        }
      }
    );

    console.log('\nThinking complete.');
    
    this.logAction('think', problem, {
      solution: result.content,
      proof: result.proof,
    });

    return result;
  }

  async act(plan: string) {
    console.log('\nExecuting the plan...');
    
    // Use Opacity for verifiable action generation with streaming
    const result = await this.opacity.generateText(
      `Execute the following plan: "${plan}". Describe the actions taken.`,
      {
        onProgress: (partial: string) => {
          process.stdout.write(partial);
        }
      }
    );

    console.log('\nExecution complete.');
    
    this.logAction('act', plan, {
      actions: result.content,
      proof: result.proof,
    });

    return result;
  }

  async getActionHistory() {
    return this.actions;
  }

  async verifyAction(proof: any) {
    return this.opacity.verifyProof(proof);
  }

  async shutdown() {
    this.logAction('observe', 'Agent shutting down');
    await this.eigenda.shutdown();
    console.log('Agent shut down');
  }
}

async function main() {
  const agent = new MonitoredAgent();
  await agent.initialize();

  try {
    // Example task: Solve a math problem
    const problem = 'Calculate the area of a circle with radius 5';
    
    // Observe the problem
    await agent.observe(problem);
    console.log('\nObserved problem:', problem);

    // Think about the solution
    const thinking = await agent.think(problem);
    console.log('\nThinking proof available:', !!thinking.proof);

    // Verify thinking proof
    const isThinkingValid = await agent.verifyAction(thinking.proof);
    console.log('Thinking proof is valid:', isThinkingValid);

    // Act on the solution
    const action = await agent.act(thinking.content);
    console.log('\nAction proof available:', !!action.proof);

    // Get action history
    console.log('\nAction History:');
    const history = await agent.getActionHistory();
    history.forEach(action => {
      console.log(`${action.type} (${new Date(action.timestamp).toISOString()})`);
      if (action.input) console.log('Input:', action.input);
      if (action.output) console.log('Output:', action.output);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await agent.shutdown();
  }
}

main(); 