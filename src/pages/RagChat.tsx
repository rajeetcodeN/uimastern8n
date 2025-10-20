import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { useChatContext } from "@/contexts/ChatContext";
import { sendToWebhook } from "@/lib/webhook";
import { toast } from "sonner";
import { AGENTS } from '@/types/chat';
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

// Mock data types
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

// Local message type (keeps types explicit for this file)
type LocalMessage = {
  id: string;
  content: string;
  images?: string[];
  sender: 'user' | 'ai';
  timestamp: Date;
  agentId?: string;
};

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "constitution.pdf",
    size: "404.2KB",
    type: "pdf",
    summary: "The Constitution of the United States establishes the fundamental framework of government, defining the structure, powers, and limits of federal authority while protecting individual rights through the Bill of Rights.",
    content: "We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America...",
    url: "/api/documents/constitution.pdf"
  },
  {
    id: "2",
    name: "Bill of Rights.pdf", 
    size: "70.5KB",
    type: "pdf",
    summary: "The Bill of Rights comprises the first ten amendments to the U.S. Constitution, guaranteeing essential civil liberties and individual rights against government overreach.",
    content: "Amendment I: Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press...",
  },
  {
    id: "3",
    name: "Constitution of India.pdf",
    size: "2.0MB", 
    type: "pdf",
    summary: "The Constitution of India is the supreme law of India, establishing the framework for governance and fundamental rights for Indian citizens.",
    content: "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens...",
  },
];

export default function RagChat() {
  const {
    conversations,
    messages,
    activeConversation,
    documents,
    activeDataSources,
    activeDocument,
    isLoading,
    isDocumentPanelCollapsed,
    currentSessionId,
    setDocuments,
    setActiveDocument,
    setIsLoading,
    setIsDocumentPanelCollapsed,
    startNewChat,
    selectConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    removeDocumentFromActiveSources,
    addDocumentToActiveSources,
    clearDuplicateActiveSources,
  } = useChatContext();

  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [webhookUrl, setWebhookUrl] = useState(
    import.meta.env.VITE_N8N_WEBHOOK_URL || "https://ssvautomate.app.n8n.cloud/webhook/03c4b591-d635-40ec-82b6-ffa42edda35f"
  );
  const [webhookMap, setWebhookMap] = useState<Record<string,string>>(() => ({
    sap: import.meta.env.VITE_N8N_WEBHOOK_SAP || 'https://nosta.app.n8n.cloud/webhook/97d71ce6-384d-455d-9dbe-48e755fc6799',
    legal: import.meta.env.VITE_N8N_WEBHOOK_LEGAL || 'https://nosta.app.n8n.cloud/webhook/8b72a299-6557-4d8c-a365-09e105d76393',
    nosta: import.meta.env.VITE_N8N_WEBHOOK_NOSTA || 'https://nosta.app.n8n.cloud/webhook/2bb88761-54cb-49b5-9c92-f15c14cc36b6',
    cost: import.meta.env.VITE_N8N_WEBHOOK_COST || 'https://nosta.app.n8n.cloud/webhook/b4c843be-698d-40c6-8e31-9370f5e165e0',
  }));

  useEffect(() => {
    setDocuments(mockDocuments);
  }, [setDocuments]);

  const handleSendMessage = async (content: string, agentId?: string) => {
    // Add user message (attach agentId if provided)
    const userMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user' as const,
      timestamp: new Date(),
      agentId: agentId || undefined,
  } as LocalMessage;

    addMessage(userMessage);
    setIsLoading(true);

    try {
      // Resolve webhook URL: prefer webhookMap (user-configured), then AGENTS defaults, then fallback webhookUrl
      let targetWebhook = webhookUrl;
      if (agentId) {
        if (webhookMap[agentId]) {
          targetWebhook = webhookMap[agentId];
        } else {
          const agent = AGENTS.find(a => a.id === agentId);
          if (agent && agent.webhookUrl) targetWebhook = agent.webhookUrl;
        }
      }

      // Send to n8n webhook
      const webhookResponse = await sendToWebhook(content, targetWebhook);
      
      if (webhookResponse.success && webhookResponse.response) {
        // AI response from webhook
        const responseContent = webhookResponse.response.trim();
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: responseContent || 'No response content received',
          images: webhookResponse.images,
          sender: 'ai' as const,
          timestamp: new Date(),
          agentId: agentId || undefined,
  } as LocalMessage;

        addMessage(aiMessage);
        
        // Update conversation title if it's the first message
        if (messages.length === 0) {
          const shortTitle = content.length > 50 ? content.substring(0, 47) + "..." : content;
          updateConversationTitle(activeConversation || '', shortTitle);
        }
      } else {
        // Fallback response
        const fallbackMessage = webhookResponse.error 
          ? `Error: ${webhookResponse.error}. Please check your webhook configuration in Settings.`
          : `I received your message "${content}" but didn't get a proper response from the AI service. Please check your n8n workflow configuration.`;
          
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          content: fallbackMessage,
          sender: 'ai' as const,
          timestamp: new Date(),
          agentId: agentId || undefined,
  } as LocalMessage;

        addMessage(aiMessage);
        toast.error(webhookResponse.error || "No response content received from AI service");
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    // Clear current messages
    addMessage({
      id: 'clear',
      content: '',
      sender: 'user',
      timestamp: new Date(),
    });
    toast.success("Chat cleared");
  };

  const handleWebhookUrlChange = (url: string) => {
    setWebhookUrl(url);
    // also update default map entries
    setWebhookMap(prev => ({...prev, sap: url, legal: url, nosta: url, cost: url}));
  };

  const toggleDocumentPanel = () => {
    setIsDocumentPanelCollapsed(!isDocumentPanelCollapsed);
  };

  const handleRenameConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setEditingConversation(id);
      setEditingTitle(conversation.title);
    }
  };

  const handleSaveRename = () => {
    if (editingConversation && editingTitle.trim()) {
      updateConversationTitle(editingConversation, editingTitle.trim());
      setEditingConversation(null);
      setEditingTitle("");
    }
  };

  const handleCancelRename = () => {
    setEditingConversation(null);
    setEditingTitle("");
  };

  const handleDeleteConversation = (id: string) => {
    if (window.confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation(id);
      toast.success("Conversation deleted");
    }
  };

  const getConversationPreview = (conversationId: string) => {
    // This would need to be implemented in the context
    return "No messages yet";
  };

  const handleDocumentClick = (documentName: string) => {
    // Find document by name (case-insensitive) with better matching
    const documentNameLower = documentName.toLowerCase().trim();
    
    // First try exact match
    let document = documents.find(d => 
      d.name.toLowerCase().trim() === documentNameLower
    );
    
    // Then try partial match
    if (!document) {
      document = documents.find(d => 
        d.name.toLowerCase().includes(documentNameLower) ||
        documentNameLower.includes(d.name.toLowerCase().trim())
      );
    }
    
    // Finally try word-based matching
    if (!document) {
      const documentWords = documentNameLower.split(/\s+/);
      document = documents.find(d => {
        const docNameLower = d.name.toLowerCase();
        return documentWords.some(word => 
          word.length > 2 && docNameLower.includes(word)
        );
      });
    }
    
    if (document) {
      setActiveDocument(document.id);
      toast.success(`Opened ${document.name}`);
    } else {
      toast.error(`Document "${documentName}" not found`);
    }
  };

  const handleSelectDocument = (id: string) => {
    console.log('Selecting document with ID:', id);
    setActiveDocument(id);
    const doc = documents.find(d => d.id === id);
    if (doc) {
      console.log('Found document:', doc.name);
      toast.success(`Loaded ${doc.name}`);
    } else {
      console.warn('Document not found with ID:', id);
      toast.error('Document not found');
    }
  };

  const handleLoadDocuments = async () => {
    // console.log('Document loading is disabled');
  };

  // Commented out test function for document matching
  /*
  const handleTestDocumentMatching = () => {
    const testMessage = "DATA loader workflow explanation";
    
    documents.forEach(doc => {
      const messageLower = testMessage.toLowerCase();
      const docNameLower = doc.name.toLowerCase().trim();
      let isMatch = false;
      
      // Strategy 1: Exact name match
      isMatch = messageLower.includes(docNameLower);
      
      // Strategy 2: Name without extension
      if (!isMatch) {
        const docNameNoExt = docNameLower.replace(/\.(pdf|doc|docx|txt)$/, '').trim();
        isMatch = messageLower.includes(docNameNoExt);
      }
      
      // Strategy 3: Key words from document name (more specific matching)
      if (!isMatch) {
        const docNameNoExt = docNameLower.replace(/\.(pdf|doc|docx|txt)$/, '').trim();
        const docWords = docNameNoExt.split(/[\s\-_&]+/).filter(word => word.length > 2);
        const messageWords = messageLower.split(/\s+/);
        
        // Count how many significant words from document name appear in message
        const matchingWords = docWords.filter(docWord => {
          const cleanDocWord = docWord.replace(/[^\w]/g, '').toLowerCase();
          return messageWords.some(msgWord => {
            const cleanMsgWord = msgWord.replace(/[^\w]/g, '').toLowerCase();
            return cleanMsgWord === cleanDocWord || 
                   cleanMsgWord.includes(cleanDocWord) || 
                   cleanDocWord.includes(cleanMsgWord);
          });
        });
        
        // Require at least 2 matching words for documents with many words, or 1 for shorter names
        const minMatches = docWords.length > 4 ? 2 : 1;
        isMatch = matchingWords.length >= minMatches;
      }
    });
  };
  */

  const selectedDocument = documents.find(d => d.id === activeDocument);

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <div className="h-full">
        <ChatSidebar
          conversations={conversations}
          documents={documents}
          activeDataSources={activeDataSources}
          activeConversation={activeConversation}
          activeDocument={activeDocument}
          webhookUrl={webhookUrl}
          webhookMap={webhookMap}
          onWebhookMapChange={(map) => setWebhookMap(map)}
          onNewChat={startNewChat}
          onSelectConversation={selectConversation}
          onSelectDocument={handleSelectDocument}
          onLoadDocuments={handleLoadDocuments}
          onRemoveDocument={removeDocumentFromActiveSources}
          onAddDocumentToActiveSources={addDocumentToActiveSources}
          onWebhookUrlChange={handleWebhookUrlChange}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          onSaveRename={handleSaveRename}
          onCancelRename={handleCancelRename}
          editingConversation={editingConversation}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          getConversationPreview={getConversationPreview}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header with Panel Toggle */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-card-foreground">NOSTA MASTER AI AGENT</h1>
            <p className="text-sm text-muted-foreground">
              Session: {currentSessionId ? `${currentSessionId.substring(0, 8)}...` : 'Not initialized'}
            </p>
          </div>
          {/* ===== ON HOLD: Document Viewer Toggle - Temporarily Hidden
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDocumentPanel}
              className="gap-2"
            >
              {isDocumentPanelCollapsed ? (
                <>
                  <PanelRightOpen className="h-4 w-4" />
                  Show Panel
                </>
              ) : (
                <>
                  <PanelRightClose className="h-4 w-4" />
                  Hide Panel
                </>
              )}
            </Button>
          </div>
          ===== END ON HOLD ===== */}
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0 h-full">
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isLoading={isLoading}
            onDocumentClick={handleDocumentClick}
          />
        </div>
      </div>

      {/* ===== ON HOLD: Document Viewer - Temporarily Hidden
      {!isDocumentPanelCollapsed && (
        <div className="w-72 h-full flex-shrink-0 border-l border-border overflow-auto">
          <DocumentViewer 
            document={selectedDocument || null}
            isCollapsed={false}
            onToggle={toggleDocumentPanel}
          />
        </div>
      )}
      ===== END ON HOLD ===== */}
    </div>
  );
}