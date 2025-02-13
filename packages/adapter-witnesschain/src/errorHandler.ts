export class WitnesschainError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "WitnesschainError";
    }
  }
  
  export class NetworkError extends WitnesschainError {
    constructor() {
      super("Network error: Unable to reach Witnesschain API.");
    }
  }
  
  export class AuthenticationError extends WitnesschainError {
    constructor() {
      super("Authentication failed: Invalid credentials.");
    }
  }
  
  export class APIError extends WitnesschainError {
    constructor(status: number, message: string) {
      super(`API Error ${status}: ${message}`);
    }
  }
  