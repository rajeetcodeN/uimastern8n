import { useState, useEffect } from "react";
import { Plus, MessageSquare, Database, File, X, Edit2, Trash2, Check, X as XIcon, RefreshCw, Menu, ChevronDown, ChevronUp, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { SettingsModal } from "./SettingsModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface Document {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'txt';
}

interface ChatSidebarProps {
  conversations: Conversation[];
  documents: Document[];
  activeDataSources: Document[];
  activeConversation: string | null;
  activeDocument: string | null;
  webhookUrl: string;
  webhookMap?: Record<string,string>;
  onWebhookMapChange?: (map: Record<string,string>) => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onSelectDocument: (id: string) => void;
  onRemoveDocument: (id: string) => void;
  onAddDocumentToActiveSources?: (id: string) => void;
  onWebhookUrlChange: (url: string) => void;
  onRenameConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  editingConversation: string | null;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  getConversationPreview: (id: string) => string;
}

export function ChatSidebar({
  conversations,
  documents,
  activeDataSources,
  activeConversation,
  activeDocument,
  webhookUrl,
  webhookMap,
  onWebhookMapChange,
  onNewChat,
  onSelectConversation,
  onSelectDocument,
  onRemoveDocument,
  onAddDocumentToActiveSources,
  onWebhookUrlChange,
  onRenameConversation,
  onDeleteConversation,
  onSaveRename,
  onCancelRename,
  editingConversation,
  editingTitle,
  setEditingTitle,
  getConversationPreview,
}: ChatSidebarProps) {
  const { t } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showActiveSources, setShowActiveSources] = useState(false);
  const navigate = useNavigate();

  // Handle mobile responsiveness
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
      }
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleActiveSources = () => {
    setShowActiveSources(!showActiveSources);
  };

  // Render collapsed sidebar (burger menu)
  if (isSidebarCollapsed) {
    return (
      <div className="h-full w-12 flex-shrink-0 flex flex-col bg-gradient-sidebar border-r border-sidebar-border relative">
        <button 
          onClick={toggleSidebar}
          className="p-3 hover:bg-sidebar-accent/20 transition-colors group flex flex-col items-center justify-center h-12 w-12"
          aria-label="Open sidebar"
        >
          <div className="w-5 flex flex-col items-center space-y-1.5">
            <span className="block h-0.5 w-5 bg-foreground rounded-full transition-transform group-hover:translate-y-1 group-hover:rotate-45" />
            <span className="block h-0.5 w-5 bg-foreground rounded-full opacity-100 group-hover:opacity-0 transition-opacity" />
            <span className="block h-0.5 w-5 bg-foreground rounded-full transition-transform group-hover:-translate-y-1 group-hover:-rotate-45" />
          </div>
        </button>
        <div className="flex-1 flex flex-col items-center justify-end p-3">
          <Button 
            onClick={onNewChat}
            className="rounded-full h-9 w-9 p-0 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
            title={t('newChat')}
            aria-label={t('newChat')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const handleLoadDocuments = async () => {
    setIsLoadingDocuments(true);
    await onLoadDocuments();
    setIsLoadingDocuments(false);
  };

  const handleDataSourceManagement = () => {
    navigate("/data-sources");
  };

  const getFileIcon = (type: string) => {
    return <File className="h-4 w-4" />;
  };

  return (
    <div className={`${isMobile ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : 'relative'} w-full md:w-80 lg:w-80 flex-shrink-0 bg-gradient-sidebar border-r border-sidebar-border flex flex-col h-full`}>
      <div className="flex items-center justify-between p-2 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold px-2">{t('chat')}</h2>
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-sidebar-accent/20 rounded-md transition-colors group mr-2"
          aria-label={t('close')}
        >
          <div className="w-5 flex flex-col items-center justify-center h-5">
            <span className="block h-0.5 w-5 bg-foreground rounded-full transition-transform rotate-45 translate-y-0.5" />
            <span className="block h-0.5 w-5 bg-foreground rounded-full transition-transform -rotate-45 -translate-y-0.5" />
          </div>
        </button>
      </div>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-1 hover:bg-sidebar-accent/20 rounded md:hidden"
            aria-label={t('close')}
          >
            <PanelLeftClose className="h-5 w-5 text-sidebar-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <img src="/nosta-logo.svg" alt="NOSTA" className="h-8 w-8 rounded-sm" />
            <h1 className="text-lg font-semibold text-sidebar-foreground">NOSTA AI</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Conversations Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-sidebar-foreground">{t('conversations')}</h2>
          </div>
          
          <Button 
            onClick={onNewChat}
            className="w-full justify-start gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            {t('newChat')}
          </Button>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="py-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "group relative rounded-md mb-1 transition-colors",
                  activeConversation === conversation.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                {editingConversation === conversation.id ? (
                  // Editing mode
                  <div className="p-2">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="h-8 text-sm mb-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveRename();
                        if (e.key === 'Escape') onCancelRename();
                      }}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-green-500 hover:text-green-400"
                        onClick={onSaveRename}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-400"
                        onClick={onCancelRename}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Normal mode
                  <div
                    className="p-2 cursor-pointer"
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {conversation.title.split(' ').slice(0, 4).join(' ')}
                          {conversation.title.split(' ').length > 4 ? '...' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {conversation.timestamp.toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {getConversationPreview(conversation.id)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-sidebar-accent/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRenameConversation(conversation.id);
                        }}
                        title="Rename conversation"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 hover:bg-red-500/20 text-red-400 hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* ===== ON HOLD: Active Data Sources Section - Temporarily Hidden =====
        <div className="border-t border-sidebar-border">
          <button 
            onClick={toggleActiveSources}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-sidebar-accent/20 transition-colors"
          >
            <h2 className="text-sm font-medium text-sidebar-foreground">Active Data Sources</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadDocuments();
                }}
                disabled={isLoadingDocuments}
                className="h-6 w-6 p-0"
                title="Refresh Documents"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
              </Button>
              {showActiveSources ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {showActiveSources && (
            <div className="px-4 pb-4">
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {activeDataSources.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground">No documents referenced yet</p>
                      <p className="text-xs text-muted-foreground/70">Documents will appear here when referenced in chat</p>
                    </div>
                  ) : (
                    activeDataSources.map((doc) => (
                      <div
                        key={doc.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors group",
                          activeDocument === doc.id
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                        onClick={() => onSelectDocument(doc.id)}
                      >
                        {getFileIcon(doc.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveDocument(doc.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <div className="border-t border-sidebar-border">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-sidebar-foreground">{t('availableDocuments')}</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDataSourceManagement}
                  className="h-6 w-6 p-0"
                  title={t('openDataSourceManagement')}
                  aria-label={t('openDataSourceManagement')}
                >
                  <Database className="h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="max-h-32">
                <div className="space-y-1">
                  {documents
                    .filter(doc => !activeDataSources.some(activeDoc => activeDoc.id === doc.id))
                    .map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors group hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        onClick={() => onSelectDocument(doc.id)}
                      >
                        {getFileIcon(doc.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                        {onAddDocumentToActiveSources && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddDocumentToActiveSources(doc.id);
                            }}
                            title={t('addToActiveSources')}
                            aria-label={`${t('addToActiveSources')} ${doc.name}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
        ===== END ON HOLD ===== */}

        {/* Settings Section */}
        <div className="p-4 border-t border-sidebar-border">
          <SettingsModal 
            webhookMap={webhookMap || { sap: webhookUrl, legal: webhookUrl, nosta: webhookUrl, cost: webhookUrl }}
            onWebhookMapChange={(map) => onWebhookMapChange ? onWebhookMapChange(map) : onWebhookUrlChange(map.sap || '')}
          />
        </div>
      </div>
    </div>
  );
}