// Mock kompletuar për AI modules
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(jest.fn()),
  env: {
    localModelPath: '/tmp/mock',
    useBrowserCache: false,
    allowRemoteModels: false,
  },
}));

// Mock AI Service
jest.mock('../src/modules/ai/ai.service', () => ({
  AiService: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockResolvedValue('Mock response'),
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

// Mock AI Module
jest.mock('../src/modules/ai/ai.module', () => ({
  AiModule: class MockAiModule {},
}));

// Mock knowledge base
jest.mock('../src/modules/ai/knowledge-base', () => ({
  knowledgeChunks: [],
  KnowledgeChunk: jest.fn(),
}));

// Fix për Node.js environment
if (typeof global.self === 'undefined') {
  (global as any).self = global;
}