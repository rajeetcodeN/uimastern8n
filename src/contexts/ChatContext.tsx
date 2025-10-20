import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { sessionManager } from '@/lib/session';
import { saveChatData, loadChatData } from '@/lib/chatStorage';

// Types
interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface Message {
  id: string;
  content: string;
  images?: string[];
  sender: 'user' | 'ai';
  timestamp: Date;
  agentId?: string;
}

interface Document {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'txt';
  content?: string;
  summary?: string;
  url?: string;
  last_modified_date?: string;
  source_url?: string;
}

interface ChatContextType {
  // Chat state
  conversations: Conversation[];
  messages: Message[];
  conversationMessages: Record<string, Message[]>;
  activeConversation: string | null;
  currentSessionId: string;
  
  // Document state
  documents: Document[];
  activeDataSources: Document[];
  activeDocument: string | null;
  
  // UI state
  isLoading: boolean;
  isDocumentPanelCollapsed: boolean;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Message[]) => void;
  setConversationMessages: (conversationMessages: Record<string, Message[]>) => void;
  setActiveConversation: (id: string | null) => void;
  setCurrentSessionId: (id: string) => void;
  setDocuments: (documents: Document[]) => void;
  setActiveDataSources: (documents: Document[]) => void;
  setActiveDocument: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsDocumentPanelCollapsed: (collapsed: boolean) => void;
  
  // Chat actions
  startNewChat: () => void;
  selectConversation: (id: string) => void;
  addMessage: (message: Message) => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  addDocumentToActiveSources: (documentId: string) => void;
  removeDocumentFromActiveSources: (documentId: string) => void;
  clearDuplicateActiveSources: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({});
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  
  // Document state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDataSources, setActiveDataSources] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<string | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isDocumentPanelCollapsed, setIsDocumentPanelCollapsed] = useState(false);

  // Initialize session and load saved conversations
  React.useEffect(() => {
    const sessionId = sessionManager.getSessionId();
    setCurrentSessionId(sessionId);
    
    // Load saved conversations
    const savedData = loadChatData(sessionId);
    if (savedData) {
      // Convert string dates back to Date objects
      const loadedConversations = savedData.conversations.map(conv => ({
        ...conv,
        timestamp: new Date(conv.timestamp),
        messages: (conversationMessages[conv.id] || []).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      
      setConversations(loadedConversations);
      
      if (savedData.activeConversation) {
        setActiveConversation(savedData.activeConversation);
        const activeConv = loadedConversations.find(c => c.id === savedData.activeConversation);
        if (activeConv) {
          setMessages(activeConv.messages);
        }
      } else if (loadedConversations.length > 0) {
        setActiveConversation(loadedConversations[0].id);
        setMessages(loadedConversations[0].messages);
      } else {
        startNewChat();
      }
    } else if (conversations.length === 0) {
      startNewChat();
    }
  }, []);
  
  // Save conversations when they change
  React.useEffect(() => {
    if (currentSessionId && conversations.length > 0) {
      saveChatData(currentSessionId, {
        conversations: conversations.map(conv => ({
          ...conv,
          messages: conversationMessages[conv.id] || [],
          activeDataSources: activeDataSources
        })),
        activeConversation
      });
    }
  }, [conversations, conversationMessages, activeConversation, activeDataSources, currentSessionId]);


  const startNewChat = useCallback(() => {
    // Save current messages to the previous conversation
    if (activeConversation && messages.length > 0) {
      setConversationMessages(prev => ({
        ...prev,
        [activeConversation]: messages
      }));
    }
    
    // Generate new session
    const newSessionId = sessionManager.createNewSession();
    setCurrentSessionId(newSessionId);
    
    // Create new conversation
    const newConversation: Conversation = {
      id: newSessionId,
      title: "New Conversation",
      timestamp: new Date(),
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newSessionId);
    setMessages([]);
    setActiveDataSources([]);
    setActiveDocument(null);
    
    setConversationMessages(prev => ({
      ...prev,
      [newSessionId]: []
    }));
    
    sessionManager.updateActivity();
  }, [activeConversation, messages, conversations.length]);

  const selectConversation = useCallback((id: string) => {
    // Save current messages to the previous conversation
    if (activeConversation && messages.length > 0) {
      setConversationMessages(prev => ({
        ...prev,
        [activeConversation]: messages
      }));
    }
    
    setActiveConversation(id);
    setCurrentSessionId(id);
    
    // Load messages for the selected conversation
    const conversationMsgs = conversationMessages[id] || [];
    setMessages(conversationMsgs);
    
    // Restore active data sources for this conversation
    const allActiveDocs: Document[] = [];
    conversationMsgs.forEach(msg => {
      if (msg.sender === 'ai') {
        documents.forEach(doc => {
          // Simple name matching - check if document name appears in the AI response
          if (msg.content.toLowerCase().includes(doc.name.toLowerCase()) && 
              !allActiveDocs.some(activeDoc => activeDoc.id === doc.id)) {
            allActiveDocs.push(doc);
          }
        });
      }
    });
    setActiveDataSources(allActiveDocs);
  }, [activeConversation, messages, conversationMessages, documents]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // Update conversation messages
    if (activeConversation) {
      setConversationMessages(prev => ({
        ...prev,
        [activeConversation]: [...(prev[activeConversation] || []), message]
      }));
    }
    
    /* Document auto-matching functionality - commented out
    if (message.sender === 'ai') {
      const sanitizeString = (str: string) => {
        if (!str) return '';
        return str
          .toLowerCase()
          .trim()
          .replace(/[\s\-_–]+/g, ' ')
          .replace(/[^\w\s]/g, '');
      };
      
      const matchedDocs = documents.filter(doc => {
        const sanitizedAiMessage = sanitizeString(message.content);
        const sanitizedDocName = sanitizeString(doc.name);
        const docNameNoExt = sanitizedDocName.replace(/\.(pdf|docx?|md)$/, '');
        return docNameNoExt ? sanitizedAiMessage.includes(docNameNoExt) : false;
      });

      const uniqueNewDocs = matchedDocs.filter(
        (doc, index, self) =>
          !activeDataSources.some(activeDoc => activeDoc.id === doc.id) &&
          index === self.findIndex(d => d.id === doc.id)
      );

      if (uniqueNewDocs.length > 0) {
        const bestDocForPreview = uniqueNewDocs.reduce((best, current) =>
          current.name.length > best.name.length ? current : best
        );
        
        if (bestDocForPreview.id) {
          setActiveDocument(bestDocForPreview.id);
        }

        setActiveDataSources(prevDocs => [...prevDocs, ...uniqueNewDocs]);
      }
    }
    */
  }, [activeConversation, activeDataSources, documents, activeDocument]);

  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id ? { ...conv, title } : conv
      )
    );
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // Clear conversation messages
    setConversationMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[id];
      return newMessages;
    });
    
    // If this was the active conversation, start a new one
    if (activeConversation === id) {
      startNewChat();
    }
  }, [activeConversation, startNewChat]);

  const addDocumentToActiveSources = useCallback((documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (document && !activeDataSources.some(doc => doc.id === documentId)) {
      setActiveDataSources(prev => [...prev, document]);
      console.log(`Manually added document "${document.name}" to active sources`);
    }
  }, [documents, activeDataSources]);

  const removeDocumentFromActiveSources = useCallback((documentId: string) => {
    setActiveDataSources(prev => prev.filter(doc => doc.id !== documentId));
    const document = documents.find(doc => doc.id === documentId);
    if (document) {
      console.log(`Removed document "${document.name}" from active sources`);
    }
  }, [documents]);

  const clearDuplicateActiveSources = useCallback(() => {
    setActiveDataSources(prev => {
      const unique = prev.filter((doc, index, self) => 
        index === self.findIndex(d => d.id === doc.id)
      );
      if (unique.length !== prev.length) {
        console.log(`Removed ${prev.length - unique.length} duplicate documents from active sources`);
      }
      return unique;
    });
  }, []);

  const value: ChatContextType = {
    // State
    conversations,
    messages,
    conversationMessages,
    activeConversation,
    currentSessionId,
    documents,
    activeDataSources,
    activeDocument,
    isLoading,
    isDocumentPanelCollapsed,
    
    // Setters
    setConversations,
    setMessages,
    setConversationMessages,
    setActiveConversation,
    setCurrentSessionId,
    setDocuments,
    setActiveDataSources,
    setActiveDocument,
    setIsLoading,
    setIsDocumentPanelCollapsed,
    
    // Actions
    startNewChat,
    selectConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    addDocumentToActiveSources,
    removeDocumentFromActiveSources,
    clearDuplicateActiveSources,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
