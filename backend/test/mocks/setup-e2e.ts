// Setup për E2E tests - Mock AI modules
jest.mock('@xenova/transformers', () => {
  return {
    pipeline: jest.fn().mockImplementation(() => {
      return async () => [[0.1, 0.2, 0.3]];
    }),
    env: {
      localModelPath: '/tmp/models',
      useBrowserCache: false,
      allowRemoteModels: false,
    },
  };
});

// Mock AI Service
jest.mock('../src/modules/ai/ai.service', () => ({
  AiService: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockResolvedValue({
      response: 'Mock AI response for testing',
      confidence: 0.95,
    }),
    vectorizeText: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    searchKnowledge: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock Vector Store Service
jest.mock('../src/modules/ai/vector-store.service', () => ({
  VectorStoreService: jest.fn().mockImplementation(() => ({
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    addDocuments: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
    vectorizeText: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  })),
}));

// Mock knowledge base
jest.mock('../src/modules/ai/knowledge-base', () => ({
  knowledgeChunks: [],
  KnowledgeChunk: jest.fn(),
}));

// Shto global 'self' për Node.js
if (typeof (global as any).self === 'undefined') {
  (global as any).self = global;
}

// Shto global 'window' për compatibility
if (typeof (global as any).window === 'undefined') {
  (global as any).window = global;
}