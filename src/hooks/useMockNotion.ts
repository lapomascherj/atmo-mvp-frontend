// Mock Notion connection for frontend-only demo
export type NotionConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export const useNotionConnection = () => {
  return {
    status: 'disconnected' as NotionConnectionStatus,
    connect: async () => {},
    disconnect: async () => {},
    error: null
  };
};

export { NotionConnectionStatus };
