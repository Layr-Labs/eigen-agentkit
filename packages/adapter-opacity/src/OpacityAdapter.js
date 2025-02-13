"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpacityAdapter = void 0;
const agentkit_1 = require("@layr-labs/agentkit");
const types_1 = require("./types");
const api_1 = require("./utils/api");
const DEFAULT_MODELS = {
    [types_1.ModelProvider.OPENAI]: {
        'gpt-4o': {
            name: 'gpt-4o',
            temperature: 0.7,
            maxOutputTokens: 2048,
            frequencyPenalty: 0,
            presencePenalty: 0,
        },
        'gpt-4o-mini': {
            name: 'gpt-4o-mini',
            temperature: 0.7,
            maxOutputTokens: 2048,
            frequencyPenalty: 0,
            presencePenalty: 0,
        },
    },
    [types_1.ModelProvider.ANTHROPIC]: {
        'claude-3-opus': {
            name: 'claude-3-opus',
            temperature: 0.7,
            maxOutputTokens: 4096,
            topP: 0.9,
        },
        'claude-3-sonnet': {
            name: 'claude-3-sonnet',
            temperature: 0.7,
            maxOutputTokens: 4096,
            topP: 0.9,
        },
        'claude-3-haiku': {
            name: 'claude-3-haiku',
            temperature: 0.7,
            maxOutputTokens: 4096,
            topP: 0.9,
        },
    },
};
class OpacityAdapter {
    constructor(config) {
        this.config = {
            modelProvider: types_1.ModelProvider.OPENAI,
            gatewayUrl: `https://gateway.ai.cloudflare.com/v1/${config.teamId}/${config.teamName}`,
            ...config,
        };
    }
    async initialize() {
        // No initialization needed for Opacity adapter
    }
    async log(data, options) {
        const timestamp = Date.now();
        const logId = await this.storeLog(data, options);
        const status = {
            type: 'opacity',
            data: {
                logId,
                proverUrl: this.config.opacityProverUrl,
            },
            timestamp,
        };
        return {
            id: logId,
            content: data,
            timestamp,
            status,
            options,
        };
    }
    async storeLog(data, options) {
        const response = await fetch(`${this.config.gatewayUrl}/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                data,
                metadata: options?.metadata,
                tags: options?.tags,
                level: options?.level || 'info',
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to store log: ${response.statusText}`);
        }
        const logId = response.headers.get('cf-aig-log-id');
        if (!logId) {
            throw new Error('No log ID received from Cloudflare');
        }
        return logId;
    }
    async info(message, metadata) {
        return this.log(message, { level: 'info', metadata });
    }
    async warn(message, metadata) {
        return this.log(message, { level: 'warn', metadata });
    }
    async error(message, metadata) {
        return this.log(message, { level: 'error', metadata });
    }
    async debug(message, metadata) {
        return this.log(message, { level: 'debug', metadata });
    }
    async checkAvailability(status) {
        if (status.type !== 'opacity' || !status.data || typeof status.data !== 'object') {
            return false;
        }
        const { logId, proverUrl } = status.data;
        if (!logId || !proverUrl) {
            return false;
        }
        try {
            const response = await fetch(`${proverUrl}/api/logs/${logId}`);
            return response.ok;
        }
        catch (error) {
            console.error('Error checking log availability:', error);
            return false;
        }
    }
    async getLogEntry(id) {
        try {
            const response = await fetch(`${this.config.opacityProverUrl}/api/logs/${id}`);
            if (!response.ok) {
                return null;
            }
            const data = await response.json();
            return {
                id,
                content: data.data,
                timestamp: data.timestamp,
                status: {
                    type: 'opacity',
                    data: {
                        logId: id,
                        proverUrl: this.config.opacityProverUrl,
                    },
                    timestamp: data.timestamp,
                },
                options: {
                    level: data.level,
                    metadata: data.metadata,
                    tags: data.tags,
                },
            };
        }
        catch (error) {
            console.error('Error retrieving log entry:', error);
            return null;
        }
    }
    async shutdown() {
        // No cleanup needed for Opacity adapter
    }
    async generateText(prompt, options) {
        try {
            const provider = this.config.modelProvider ?? types_1.ModelProvider.OPENAI;
            const model = options?.model || (provider === types_1.ModelProvider.OPENAI ? 'gpt-4o' : 'claude-3-sonnet');
            const providerModels = DEFAULT_MODELS[provider];
            if (!providerModels) {
                throw new Error(`Unsupported model provider: ${provider}`);
            }
            const modelConfig = providerModels[model];
            if (!modelConfig) {
                throw new Error(`Unsupported model: ${model}`);
            }
            const endpoint = `${this.config.gatewayUrl}/${provider}/chat/completions`;
            console.log('Generating text with options:', {
                modelProvider: provider,
                model: model,
                endpoint: endpoint
            });
            // Prepare the request body based on the provider
            let body;
            if (provider === types_1.ModelProvider.OPENAI) {
                body = {
                    model: modelConfig.name,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: options?.temperature ?? modelConfig.temperature,
                    max_tokens: options?.maxTokens ?? modelConfig.maxOutputTokens,
                    frequency_penalty: modelConfig.frequencyPenalty,
                    presence_penalty: modelConfig.presencePenalty,
                };
            }
            else if (provider === types_1.ModelProvider.ANTHROPIC) {
                body = {
                    model: modelConfig.name,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: options?.temperature ?? modelConfig.temperature,
                    max_tokens: options?.maxTokens ?? modelConfig.maxOutputTokens,
                    top_p: modelConfig.topP,
                    top_k: modelConfig.topK,
                };
            }
            console.debug('Request body:', JSON.stringify(body, null, 2));
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorText
                });
                throw new Error(`API request failed: ${errorText}`);
            }
            // Log response details in a TypeScript-friendly way
            const headers = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });
            console.debug('API response:', {
                status: response.status,
                statusText: response.statusText,
                headers
            });
            const logId = response.headers.get('cf-aig-log-id');
            if (!logId) {
                throw new agentkit_1.ProofGenerationError('No log ID received from Cloudflare');
            }
            const result = await response.json();
            const content = provider === types_1.ModelProvider.OPENAI
                ? result.choices[0]?.message?.content
                : result.content;
            if (!content) {
                throw new agentkit_1.ProofGenerationError('No content returned from API');
            }
            console.debug('Generating proof for log ID:', logId);
            const proof = await (0, api_1.generateProof)(this.config.opacityProverUrl, logId);
            console.debug('Proof generated successfully');
            return {
                content,
                proof,
            };
        }
        catch (error) {
            console.error('Error in generateText:', error);
            if (error instanceof agentkit_1.ProofGenerationError) {
                throw error;
            }
            throw new agentkit_1.ProofGenerationError('Failed to generate text with proof', error);
        }
    }
    async verifyProof(proof) {
        try {
            return await (0, api_1.verifyProof)(this.config.opacityProverUrl, proof);
        }
        catch (error) {
            throw new agentkit_1.ProofVerificationError('Failed to verify proof', proof, error);
        }
    }
}
exports.OpacityAdapter = OpacityAdapter;
//# sourceMappingURL=OpacityAdapter.js.map