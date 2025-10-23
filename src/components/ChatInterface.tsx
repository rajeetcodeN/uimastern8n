import React, { useState, useRef, useEffect } from "react";
import { Send, Maximize2, X, Trash2, Flag, AlertTriangle, ImageOff, MessageSquare, ThumbsDown, Link2Off } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { InteractiveImage } from "./InteractiveImage";

interface Message {
  id: string;
  content: string;
  images?: string[];
  sender: 'user' | 'ai';
  timestamp: Date;
  agentId?: string;
  feedback?: {
    type: 'image_broken' | 'inaccurate_info' | 'irrelevant' | 'document_link_broken' | 'other';
    comment?: string;
    messageContent?: string;
    messageImages?: string[];
    timestamp?: string;
  };
}

type FeedbackType = 'image_broken' | 'inaccurate_info' | 'irrelevant' | 'document_link_broken' | 'other';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, agentId?: string) => void;
  onClearChat: () => void;
  onStopRequest?: () => void;
  isLoading?: boolean;
  onDocumentClick?: (documentName: string) => void;
  onFileUpload?: (file: File) => Promise<void> | void;
}

import { Agent, AGENTS } from '@/types/chat';
import { AgentSelector } from '@/components/chat/AgentSelector';
import { InitialAgentPrompt } from '@/components/chat/InitialAgentPrompt';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChatContext } from '@/contexts/ChatContext';
import { submitFeedback as submitFeedbackToSupabase } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function ChatInterface({ 
  messages, 
  onSendMessage, 
  onClearChat, 
  onStopRequest,
  isLoading = false, 
  onDocumentClick 
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [maximizedImage, setMaximizedImage] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null);
  const { currentSessionId, addMessage } = useChatContext();
  const { t } = useLanguage();
  const [feedbackInput, setFeedbackInput] = useState<{ [key: string]: string }>({});
  const [showFeedbackInput, setShowFeedbackInput] = useState<{ [key: string]: boolean }>({});
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<{ [key: string]: FeedbackType | null }>({});

  const handleFeedbackSelect = (messageId: string, type: FeedbackType) => {
    setSelectedFeedbackType(prev => ({
      ...prev,
      [messageId]: type
    }));
    
    if (type === 'other') {
      setShowFeedbackInput(prev => ({
        ...prev,
        [messageId]: true
      }));
    } else {
      // Auto-submit non-other feedback
      submitFeedback(messageId, type);
    }
  };

  const submitFeedback = async (messageId: string, type: FeedbackType, comment?: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      // Get current user ID if available
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare feedback data
      const feedbackData = {
        messageId,
        type,
        comment,
        messageContent: message.content,
        messageImages: message.images,
        agentId: message.agentId,
        sessionId: currentSessionId,
        userId: user?.id,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      };

      // Save to Supabase
      const { error } = await submitFeedbackToSupabase(feedbackData);
      
      if (error) throw error;

      // Update local state
      const updatedMessages = messages.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              feedback: { 
                type,
                comment: type === 'other' ? comment : undefined,
                messageContent: message.content,
                messageImages: message.images,
                timestamp: new Date().toISOString()
              } 
            }
          : msg
      );
      
      // Show success message
      const feedbackMessages = {
        image_broken: 'Thank you for reporting the broken image!',
        inaccurate_info: 'Thank you for your feedback. We\'ll review the information.',
        irrelevant: 'We appreciate your feedback and will use it to improve our responses.',
        document_link_broken: 'Thank you for reporting the broken document link!',
        other: 'Thank you for your feedback!'
      };
      
      toast.success(feedbackMessages[type]);
      
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      // Reset feedback UI state
      setShowFeedbackInput(prev => ({
        ...prev,
        [messageId]: false
      }));
      setSelectedFeedbackType(prev => ({
        ...prev,
        [messageId]: null
      }));
      setFeedbackInput(prev => ({
        ...prev,
        [messageId]: ''
      }));
    }
  };

  const handleFeedbackSubmit = (messageId: string) => {
    const type = selectedFeedbackType[messageId];
    const comment = feedbackInput[messageId];
    
    if (type) {
      submitFeedback(messageId, type, comment);
    }
  };
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Ensure chat input is focused and scrolled to bottom on new chat
    if (inputRef.current && messages.length === 0) {
      inputRef.current.focus();
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput && !isLoading) {
      // If this is the first message, use it as the conversation name
      if (messages.length === 0) {
        // Truncate the message if it's too long
        const conversationName = trimmedInput.length > 30 
          ? `${trimmedInput.substring(0, 30)}...` 
          : trimmedInput;
        
        // Add a small delay to ensure the message is processed first
        setTimeout(() => {
          // This assumes the parent component will handle the conversation naming
          // You might need to adjust this based on your actual implementation
          if (typeof (window as any).renameCurrentConversation === 'function') {
            (window as any).renameCurrentConversation(conversationName);
          }
        }, 100);
      }
      
      onSendMessage(trimmedInput, currentAgent?.id);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClearChat = () => {
    onClearChat();
    toast.success("Chat cleared");
  };

  const handleAgentSelect = (agent: Agent) => {
    setPendingAgent(agent);
    if (agent.password) {
      setShowPasswordPrompt(true);
    } else {
      setCurrentAgent(agent);
      setShowAgentSelector(false);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (pendingAgent?.password === password) {
      setCurrentAgent(pendingAgent);
      setShowPasswordPrompt(false);
      setShowAgentSelector(false);
    }
  };

  const handleAgentChange = (agent: Agent) => {
    setPendingAgent(agent);
    if (agent.password) {
      setShowPasswordPrompt(true);
    } else {
      setCurrentAgent(agent);
    }
  };

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileMessage, setFileMessage] = useState('');

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Check if Legal agent is selected
    if (currentAgent.id !== 'legal') {
      toast.warning(t('fileUploadOnlyLegal'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPendingFile(file);
    setIsFileDialogOpen(true);
  };

  const handleFileUpload = async () => {
    if (!pendingFile) return;
    
    try {
      // Create a user message for the file upload
      const userMessage = {
        id: Date.now().toString(),
        content: fileMessage || `${t('fileUploaded')}: ${pendingFile.name}`,
        sender: 'user' as const,
        timestamp: new Date(),
        agentId: currentAgent?.id
      };
      
      // Add user message to chat
      addMessage(userMessage);
      
      // Prepare form data
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('chatInput', fileMessage || 'Document upload');
      formData.append('sessionId', currentSessionId);
      formData.append('timestamp', new Date().toISOString());
      
      // Get the webhook URL for the legal agent
      const legalWebhookUrl = 'https://nosta.app.n8n.cloud/webhook/8b72a299-6557-4d8c-a365-09e105d76393';
      
      // Use the same webhook function as other agents
      const webhookResponse = await fetch(legalWebhookUrl, {
        method: 'POST',
        body: formData
      });

      console.log('Webhook response status:', webhookResponse.status);
      
      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Webhook error response:', errorText);
        throw new Error(`HTTP error! status: ${webhookResponse.status}`);
      }
      
      // Get the raw response text first
      const responseText = await webhookResponse.text();
      console.log('Raw response text:', responseText);
      
      // Try to parse as JSON, fall back to raw text if not valid JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('Parsed JSON response:', responseData);
      } catch (e) {
        console.log('Response is not valid JSON, using as plain text');
        responseData = { text: responseText };
      }
      
      // Log the full response data for debugging
      console.log('Response data structure:', {
        keys: Object.keys(responseData),
        hasText: 'text' in responseData,
        hasResponse: 'response' in responseData,
        hasMessage: 'message' in responseData,
        fullData: responseData
      });
      
      // Try to extract the response text from various possible locations
     const responseContent = 
  responseData.output ||  // Check for 'output' field first
  responseData.text || 
  responseData.response || 
  responseData.message ||
  responseData.data?.output ||
  responseData.data?.text ||
  responseData.data?.response ||
  (typeof responseData === 'string' ? responseData : t('fileProcessed'));

console.log('Final response content:', responseContent);

      
      // Add AI response to chat
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'ai' as const,
        timestamp: new Date(),
        agentId: currentAgent?.id
      };
      
      addMessage(aiMessage);
      toast.success(t('fileProcessed'));
      
    } catch (err) {
      console.error('File upload failed:', err);
      
      // Add error message to chat
      addMessage({
        id: (Date.now() + 1).toString(),
        content: `${t('error')}: ${err instanceof Error ? err.message : t('unknownError')}`,
        sender: 'ai' as const,
        timestamp: new Date(),
        agentId: currentAgent?.id
      });
      
      toast.error(t('fileUploadFailed'));
    } finally {
      // Reset state
      setPendingFile(null);
      setFileMessage('');
      setIsFileDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    setPendingFile(null);
    setFileMessage('');
    setIsFileDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    // Restore selected agent from localStorage
    try {
      const saved = localStorage.getItem('selectedAgent');
      if (saved) {
        const found = AGENTS.find(a => a.id === saved);
        if (found) setCurrentAgent(found);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('selectedAgent', currentAgent.id);
    } catch (e) {
      // ignore
    }
  }, [currentAgent]);

  // Function to detect document links and create clickable elements
  const createDocumentLink = (text: string) => {
    if (!onDocumentClick) return text;
    
    // Pattern to match document names (e.g., "DATA loader Documentation", "constitution.pdf", etc.)
    const documentPattern = /(\b[A-Z][a-zA-Z\s]+(?:Documentation|Document|Guide|Manual|PDF|pdf|doc|docx)\b)/gi;
    
    return text.split(documentPattern).map((part, index) => {
      if (documentPattern.test(part)) {
        return (
          <button
            key={index}
            onClick={() => onDocumentClick(part.trim())}
            className="text-blue-400 hover:text-blue-300 underline cursor-pointer bg-blue-500/10 hover:bg-blue-500/20 px-1 py-0.5 rounded transition-colors"
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Agent Selector Dialog */}
      <Dialog open={showAgentSelector} onOpenChange={setShowAgentSelector}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select an Agent</DialogTitle>
            <DialogDescription>
              Choose an agent to start chatting with
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {AGENTS.map((agent) => (
              <Button
                key={agent.id}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => handleAgentSelect(agent)}
              >
                <span className="text-lg">{agent.icon}</span>
                <span className="flex-1 text-left">{agent.name}</span>
                {agent.password && <Lock className="w-4 h-4 text-muted-foreground" />}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Prompt */}
      <InitialAgentPrompt
        isOpen={showPasswordPrompt}
        agent={pendingAgent!}
        onAuthenticated={() => {
          if (pendingAgent) {
            setCurrentAgent(pendingAgent);
            setShowPasswordPrompt(false);
            setShowAgentSelector(false);
          }
        }}
      />
      {/* Cost Cal Banner */}
      {currentAgent?.id === 'cost' && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex-1">
              For full cost calculation tool, visit{' '}
              <a 
                href="https://costcalculation.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium underline inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              >
                Nosta Cost Estimation Agent - Industrial Parts Calculator
                <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
        <div className="w-full">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 px-8">
              <div className="text-lg mb-2">{t('welcomeTitle')}</div>
              <p>{t('welcomeSubtitle')}</p>
            </div>
          ) : (
            <div className="space-y-8 px-8 py-6">
              {messages.map((message) => (
                <div key={message.id} className="w-full">
                  {message.sender === 'user' ? (
                    // User message with bubble
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[70%] rounded-lg p-4 shadow-card bg-chat-user text-chat-user-foreground">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-chat-user-foreground text-chat-user">
                            U
                          </div>
                          <div className="flex-1">
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // AI response - document-like layout
                    <div className="w-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gradient-primary text-white">
                          AI
                        </div>
                        <div className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 p-0 ml-2 bg-background/80 hover:bg-accent/50 border-border/50 hover:border-foreground/50 hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            title="Report an issue"
                          >
                            <Flag className="h-3.5 w-3.5 text-foreground/70 hover:text-foreground transition-colors" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => handleFeedbackSelect(message.id, 'image_broken')}
                          >
                            <ImageOff className="mr-2 h-4 w-4" />
                            <span>{t('imageBroken')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleFeedbackSelect(message.id, 'inaccurate_info')}
                          >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            <span>{t('inaccurateInfo')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleFeedbackSelect(message.id, 'irrelevant')}
                          >
                            <ThumbsDown className="mr-2 h-4 w-4" />
                            <span>{t('irrelevant')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleFeedbackSelect(message.id, 'document_link_broken')}
                          >
                            <Link2Off className="mr-2 h-4 w-4" />
                            <span>{t('documentLinkBroken')}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleFeedbackSelect(message.id, 'other')}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>{t('other')}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {showFeedbackInput[message.id] && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="text"
                          placeholder="Please describe the issue..."
                          value={feedbackInput[message.id] || ''}
                          onChange={(e) => setFeedbackInput(prev => ({
                            ...prev,
                            [message.id]: e.target.value
                          }))}
                          className="h-8 text-xs w-48"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleFeedbackSubmit(message.id);
                            }
                          }}
                        />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 px-2 text-xs"
                          onClick={() => handleFeedbackSubmit(message.id)}
                        >
                          Send
                        </Button>
                      </div>
                    )}
                    
                    {message.feedback && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {message.feedback.type === 'image_broken' && 'Reported: Broken Image'}
                        {message.feedback.type === 'inaccurate_info' && 'Reported: Inaccurate Info'}
                        {message.feedback.type === 'irrelevant' && 'Reported: Irrelevant'}
                        {message.feedback.type === 'document_link_broken' && 'Reported: Broken Document Link'}
                        {message.feedback.type === 'other' && 'Feedback Submitted'}
                      </div>
                    )}
                      
                      {/* AI Response Content - Full Width */}
                      <div className="prose prose-sm max-w-none text-foreground dark:prose-invert prose-p:leading-relaxed prose-p:my-3 prose-headings:mt-6 prose-headings:mb-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            img: (props) => {
                              const p = props as unknown as Record<string, unknown>;
                              return <InteractiveImage src={String(p.src ?? '')} alt={String(p.alt ?? '')} />;
                            },
                            a: ({ href, children, ...props }) => (
                              <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline"
                                {...props}
                              >
                                {children}
                              </a>
                            ),
                            code: ({ children, className, ...props }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              );
                            },
                            pre: ({ children, ...props }) => (
                              <pre className="bg-muted p-3 rounded-lg overflow-x-auto" {...props}>
                                {children}
                              </pre>
                            ),
                            h1: ({ children, ...props }) => (
                              <h1 className="text-2xl font-bold text-foreground mb-4 mt-6 first:mt-0" {...props}>
                                {children}
                              </h1>
                            ),
                            h2: ({ children, ...props }) => (
                              <h2 className="text-xl font-semibold text-foreground mb-3 mt-5 first:mt-0" {...props}>
                                {children}
                              </h2>
                            ),
                            h3: ({ children, ...props }) => (
                              <h3 className="text-lg font-medium text-foreground mb-2 mt-4 first:mt-0" {...props}>
                                {children}
                              </h3>
                            ),
                            p: ({ children, ...props }) => {
                              // Check if this paragraph contains an image
                              const hasImage = React.Children.toArray(children).some(child => 
                                React.isValidElement(child) && child.type === 'img'
                              );
                              
                              const Tag = hasImage ? 'div' : 'div';
                              
                              return (
                                <Tag className="text-foreground leading-relaxed my-3 text-[15px]" {...props}>
                                  {typeof children === 'string' ? createDocumentLink(children) : children}
                                </Tag>
                              );
                            },
                            ol: ({ children, ...props }) => (
                              <ol className="list-decimal list-inside text-foreground space-y-2 pl-5 my-3" {...props}>
                                {children}
                              </ol>
                            ),
                            ul: ({ children, ...props }) => (
                              <ul className="list-disc list-inside text-foreground space-y-2 pl-5 my-3" {...props}>
                                {children}
                              </ul>
                            ),
                            li: ({ children, ...props }) => (
                              <li className="pl-2 my-1" {...props}>
                                {children}
                              </li>
                            ),
                            
                            blockquote: ({ children, ...props }) => (
                              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3" {...props}>
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Images */}
                      {message.images && message.images.length > 0 && (
                        <div className="grid gap-4 grid-cols-1 mt-4">
                          {message.images.map((imageUrl, index) => (
                            <div
                              key={index}
                              className="relative group cursor-pointer rounded-md overflow-hidden border border-document-border"
                              onClick={() => setMaximizedImage(imageUrl)}
                            >
                              <img
                                src={imageUrl}
                                alt={`Response image ${index + 1}`}
                                className="w-full h-auto max-h-64 object-contain bg-document"
                              />
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                                >
                                  <Maximize2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gradient-primary text-white">
                      AI
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Fixed at bottom */}
      <div className="p-4 border-t border-border bg-card flex-shrink-0">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex gap-2 items-end">
            <div className="flex items-center gap-2">
              <AgentSelector currentAgent={currentAgent} onAgentChange={setCurrentAgent} />
            </div>
            <input
              aria-label="Upload file"
              ref={el => (fileInputRef.current = el)}
              type="file"
              className="hidden"
              onChange={handleFileSelected}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              title="Upload file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L20 9.828a4 4 0 10-5.656-5.656L9.172 9.344" />
              </svg>
            </Button>
            {isLoading && onStopRequest ? (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={onStopRequest}
                title="Stop generating"
                className="h-10 w-10 animate-pulse"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                disabled={messages.length === 0}
                title="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Input
              ref={inputRef}
              className="flex-1"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* File Upload Dialog */}
        {isFileDialogOpen && pendingFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Upload File</h3>
              <div className="mb-4">
                <p className="text-sm">Uploading and extracting: <span className="font-medium">{pendingFile.name}</span> ({(pendingFile.size / 1024).toFixed(1)}KB)</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelUpload}>
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleFileUpload();
                  }} 
                  className="bg-gradient-primary"
                >
                  Upload
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Maximized Image View */}
        {maximizedImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setMaximizedImage(null)}
          >
            <div className="relative max-w-full max-h-full">
              <Button
                size="sm"
                className="absolute -top-10 right-0 bg-white/10 hover:bg-white/20 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setMaximizedImage(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={maximizedImage}
                alt="Maximized view"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}