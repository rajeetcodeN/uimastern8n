interface StoredConversation {
  id: string;
  title: string;
  timestamp: string;
  messages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
    agentId?: string;
    images?: string[];
  }>;
  activeDataSources: Array<{
    id: string;
    name: string;
    size: string;
    type: 'pdf' | 'doc' | 'txt';
    content?: string;
    summary?: string;
    url?: string;
    last_modified_date?: string;
    source_url?: string;
  }>;
}

const CHAT_STORAGE_KEY = 'rag_chat_data';

export const saveChatData = (userId: string, data: {
  conversations: StoredConversation[];
  activeConversation: string | null;
}) => {
  try {
    const storageKey = `${CHAT_STORAGE_KEY}_${userId}`;
    localStorage.setItem(storageKey, JSON.stringify({
      ...data,
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to save chat data:', error);
  }
};

export const loadChatData = (userId: string): {
  conversations: StoredConversation[];
  activeConversation: string | null;
} | null => {
  try {
    const storageKey = `${CHAT_STORAGE_KEY}_${userId}`;
    const data = localStorage.getItem(storageKey);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return {
      conversations: parsed.conversations || [],
      activeConversation: parsed.activeConversation || null
    };
  } catch (error) {
    console.error('Failed to load chat data:', error);
    return null;
  }
};

export const clearChatData = (userId: string) => {
  try {
    const storageKey = `${CHAT_STORAGE_KEY}_${userId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear chat data:', error);
  }
};
