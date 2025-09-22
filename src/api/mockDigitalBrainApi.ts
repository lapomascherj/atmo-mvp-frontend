// Mock DigitalBrain API for frontend-only demo
export class MockDigitalBrainAPI {
  async checkHealth() {
    return { success: true, message: "Mock service healthy" };
  }
  
  async checkAIHealth() {
    return {
      success: true,
      data: {
        openai: { status: "healthy", responseTime: 100 },
        claude: { status: "healthy", responseTime: 120 }
      }
    };
  }
  
  async ask(params: any) {
    return {
      success: true,
      data: { response: "This is a mock response from the AI." },
      metadata: { requestId: "mock-id", timestamp: new Date().toISOString(), userId: "demo" }
    };
  }
  
  async getHelp(params: any) {
    return {
      success: true,
      data: { response: "This is mock help from the AI assistant." },
      metadata: { requestId: "mock-id", timestamp: new Date().toISOString(), userId: "demo" }
    };
  }
  
  async optimize(params: any) {
    return {
      success: true,
      message: "Mock optimization complete",
      data: { project: {} }
    };
  }
}

export const digitalBrainAPI = new MockDigitalBrainAPI();
export default digitalBrainAPI;
