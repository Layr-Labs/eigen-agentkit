"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DALogRetrievalError = exports.DALogStorageError = exports.ProofGenerationError = exports.ProofVerificationError = void 0;
/**
 * Error thrown when proof verification fails
 */
class ProofVerificationError extends Error {
    constructor(message, proof, details) {
        super(message);
        this.proof = proof;
        this.details = details;
        this.name = 'ProofVerificationError';
    }
}
exports.ProofVerificationError = ProofVerificationError;
/**
 * Error thrown when proof generation fails
 */
class ProofGenerationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'ProofGenerationError';
    }
}
exports.ProofGenerationError = ProofGenerationError;
/**
 * Error thrown when DA log storage fails
 */
class DALogStorageError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'DALogStorageError';
    }
}
exports.DALogStorageError = DALogStorageError;
/**
 * Error thrown when DA log retrieval fails
 */
class DALogRetrievalError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.name = 'DALogRetrievalError';
    }
}
exports.DALogRetrievalError = DALogRetrievalError;
//# sourceMappingURL=types.js.map