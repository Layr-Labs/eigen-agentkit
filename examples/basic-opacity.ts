import { OpacityAdapter, ModelProvider } from '@layr-labs/agentkit-opacity';
import { VerifiableInferenceResult } from '@layr-labs/agentkit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check required environment variables
const requiredEnvVars = [
  'OPACITY_TEAM_ID',
  'OPACITY_TEAM_NAME',
  'OPACITY_API_KEY',
  'OPACITY_PROVER_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

async function main() {
  // Initialize the Opacity adapter
  const opacity = new OpacityAdapter({
    teamId: process.env.OPACITY_TEAM_ID!,
    teamName: process.env.OPACITY_TEAM_NAME!,
    apiKey: process.env.OPACITY_API_KEY!,
    opacityProverUrl: process.env.OPACITY_PROVER_URL!,
    modelProvider: ModelProvider.OPENAI,
  });

  // Log configuration (without sensitive data)
  console.log('Opacity Configuration:', {
    teamId: process.env.OPACITY_TEAM_ID,
    teamName: process.env.OPACITY_TEAM_NAME,
    proverUrl: process.env.OPACITY_PROVER_URL,
    modelProvider: ModelProvider.OPENAI
  });

  try {
    // Example 1: Simple text generation with proof
    console.log('Example 1: Simple text generation');
    
    // Test prover URL accessibility
    try {
      const proverResponse = await fetch(`${process.env.OPACITY_PROVER_URL}/api/proofs/generate`);
      console.log('Prover URL test response:', {
        status: proverResponse.status,
        statusText: proverResponse.statusText
      });
    } catch (error) {
      console.error('Error accessing prover URL:', error);
    }

    const result = await opacity.generateText('What is the capital of France?', {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 100,
    });
    console.log('Generated text:', result.content);
    console.log('Proof:', result.proof);
    
    // Verify the proof
    const isValid = await opacity.verifyProof(result.proof);
    console.log('Proof is valid:', isValid);

    // Example 2: Generation with custom parameters
    console.log('\nExample 2: Generation with custom parameters');
    const customResult = await opacity.generateText(
      'Write a haiku about programming',
      {
        model: 'gpt-4o',
        temperature: 0.9,
        maxTokens: 50,
      }
    );
    console.log('Generated haiku:', customResult.content);
    console.log('Proof:', customResult.proof);

    // Example 3: Multiple generations
    console.log('\nExample 3: Multiple generations');
    const prompts = [
      'Explain quantum computing',
      'Write a recipe for pasta',
      'Describe the color blue',
    ];

    const results = await Promise.all(
      prompts.map(prompt => opacity.generateText(prompt))
    );

    results.forEach((result: VerifiableInferenceResult, i: number) => {
      console.log(`\nPrompt ${i + 1}: ${prompts[i]}`);
      console.log('Response:', result.content);
      console.log('Has proof:', !!result.proof);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 