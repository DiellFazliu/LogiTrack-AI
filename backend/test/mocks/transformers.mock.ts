// Mock kompletuar për @xenova/transformers
const mockPipeline = jest.fn().mockImplementation(() => {
  return async (text: string) => {
    return [[0.1, 0.2, 0.3, 0.4, 0.5]];
  };
});

const mockEnv = {
  localModelPath: '/tmp/models',
  useBrowserCache: false,
  allowRemoteModels: false,
  backends: {
    onnx: {
      wasm: {
        paths: {
          'ort-wasm.wasm': '/dev/null',
          'ort-wasm-simd.wasm': '/dev/null',
          'ort-wasm-threaded.wasm': '/dev/null',
        },
      },
    },
  },
};

// Mock global 'self' për Node.js environment
if (typeof global.self === 'undefined') {
  (global as any).self = global;
}

export const pipeline = mockPipeline;
export const env = mockEnv;