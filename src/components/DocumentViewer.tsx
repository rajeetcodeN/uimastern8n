import { File, FileText, ChevronLeft, ChevronRight, Eye, Info, ExternalLink, Maximize2, Minimize2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

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

interface DocumentViewerProps {
  document: Document | null;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function DocumentViewer({ document, isCollapsed, onToggle }: DocumentViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Build a Google preview URL from a Drive/Docs URL or raw FILE_ID
  const buildGooglePreviewUrl = (input?: string): string | undefined => {
    if (!input) return undefined;

    const raw = input.trim();

    // If it's already a preview URL, return as is
    if (/(\/preview)(#|\?|$)/.test(raw)) return raw;

    // Try to extract FILE_ID from common patterns
    const idMatch =
      raw.match(/\/d\/([^/]+)/)?.[1] || // .../d/FILE_ID/
      raw.match(/[?&]id=([^&]+)/)?.[1] ||
      (/^[A-Za-z0-9_-]{20,}$/.test(raw) ? raw : null); // raw ID

    if (!idMatch) return undefined;

    // Decide base by host path
    if (raw.includes('docs.google.com/document') || /\.(doc|gdoc)$/i.test(raw)) {
      return `https://docs.google.com/document/d/${idMatch}/preview`;
    }

    // Default to Drive file preview (works for PDFs and other files converted by Drive)
    return `https://drive.google.com/file/d/${idMatch}/preview`;
  };

  const previewUrl = buildGooglePreviewUrl(document?.url || document?.source_url);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        handleExitFullscreen();
      }
    };

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  // Force iframe reload when document changes to ensure proper zoom
  useEffect(() => {
    if (document) {
      setIframeKey(prev => prev + 1);
    }
  }, [document]);

  // Toggle button - always visible
  const ToggleButton = () => (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-10 w-6 h-12 rounded-r-none rounded-l-md bg-document border border-r-0 border-document-border hover:bg-muted/50"
    >
      {isCollapsed ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  );

  if (isCollapsed) {
    return (
      <div className="relative">
        <ToggleButton />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="w-80 bg-document border-l border-document-border flex flex-col h-full relative">
        <ToggleButton />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center p-8">
            <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Document Selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a document from the sidebar to view its contents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-document border-l border-document-border flex flex-col h-full relative">
      <ToggleButton />
      
      {/* Header */}
      <div className="p-4 border-b border-document-border">
        <div className="flex items-center gap-2 mb-2">
          {getFileIcon(document.type)}
          <h2 className="text-sm font-medium text-foreground truncate">
            {document.name}
          </h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          {document.type.toUpperCase()}
        </Badge>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="viewer" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="viewer">Viewer</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="viewer" className="flex-1 m-0">
          {/* Document Summary */}
          {document.summary && (
            <div className="p-4 border-b border-document-border bg-muted/30">
              <h3 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                <Eye className="h-3 w-3" />
                Summary
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {document.summary}
              </p>
            </div>
          )}

          {/* Content Viewer */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content Preview
                </h3>
                
                {/* Document viewer with CSP-safe fallback */}
                {(previewUrl || (document.type === 'pdf' && document.url)) ? (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-muted-foreground">
                        Document Viewer
                      </p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={handleFullscreen}
                          title="Open in fullscreen"
                        >
                          <Maximize2 className="h-3 w-3 mr-1" />
                          Fullscreen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => window.open(previewUrl || document.url, '_blank')}
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          New Tab
                        </Button>
                      </div>
                    </div>
                    
                    {/* Document preview with fallback */}
                    <div className="w-full border border-border rounded-lg overflow-hidden bg-muted/20" style={{ height: 'fit-content', maxHeight: '400px' }}>
                      <iframe
                        key={iframeKey}
                        src={`${(previewUrl || document.url) + (/(#|\?)/.test(previewUrl || document.url) ? '' : '')}#toolbar=0&navpanes=0&scrollbar=1&zoom=60&view=FitH`}
                        className="w-full border-0 rounded-lg"
                        title={`PDF viewer for ${document.name}`}
                        style={{ 
                          height: '350px',
                          width: '100%',
                          transform: 'scale(0.9)',
                          transformOrigin: 'top left'
                        }}
                        onError={(e) => {
                          console.log('Iframe failed to load, showing fallback');
                          // Hide iframe and show fallback
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      {/* Fallback UI - hidden by default */}
                      <div className="h-[350px] flex-col items-center justify-center bg-background/50" style={{ display: 'none' }}>
                        <div className="text-center p-6">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <h3 className="text-sm font-medium text-foreground mb-2">{document.name}</h3>
                          <p className="text-xs text-muted-foreground mb-4">
                            Click "New Tab" to view this document
                          </p>
                          <Button
                            size="sm"
                            onClick={() => window.open(previewUrl || document.url, '_blank')}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open Document
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Text content for other file types */
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {document.content ? (
                        document.content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
                          if (part.match(/^https?:\/\//)) {
                            return (
                              <a
                                key={index}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline transition-colors"
                              >
                                {part}
                              </a>
                            );
                          }
                          return <span key={index}>{part}</span>;
                        })
                      ) : (
                        "Content not available for preview"
                      )}
                    </div>
                    {document.url && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => window.open(document.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Original File
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="details" className="flex-1 m-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Document Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Name</label>
                    <p className="text-sm text-foreground font-medium">{document.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Last Modified Date</label>
                    <p className="text-sm text-foreground">
                      {document.last_modified_date 
                        ? new Date(document.last_modified_date).toLocaleDateString() 
                        : new Date().toLocaleDateString()
                      }
                    </p>
                  </div>
                  
                  {(document.source_url || document.url) && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Source URL</label>
                      <div className="bg-muted/50 p-2 rounded text-xs break-all">
                        <p className="text-foreground">
                          {document.source_url || document.url}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-5 mt-1 text-xs"
                          onClick={() => window.open(document.source_url || document.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Type</label>
                    <p className="text-sm text-foreground uppercase">{document.type}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Size</label>
                    <p className="text-sm text-foreground">{document.size || "Unknown"}</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Fullscreen Modal */}
      {isFullscreen && document && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between p-4 bg-background border-b border-border">
            <div className="flex items-center gap-3">
              {getFileIcon(document.type)}
              <h2 className="text-lg font-semibold text-foreground">
                {document.name}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {document.type.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(document.url, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExitFullscreen}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Exit Fullscreen
              </Button>
            </div>
          </div>

          {/* Fullscreen Content */}
          <div className="flex-1 p-4">
            {document.type === 'pdf' && document.url ? (
              <>
                <iframe
                  key={`fullscreen-${iframeKey}`}
                  src={`${previewUrl || document.url}#toolbar=1&navpanes=1&scrollbar=1&zoom=75&view=FitH`}
                  className="w-full h-full border-0 rounded"
                  title={`Fullscreen PDF viewer for ${document.name}`}
                  style={{ 
                    minHeight: 'calc(100vh - 120px)',
                    width: '100%'
                  }}
                  onError={(e) => {
                    console.log('Fullscreen iframe failed to load, showing fallback');
                    // Hide iframe and show fallback
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                {/* Fallback UI - hidden by default */}
                <div className="w-full h-full flex-col items-center justify-center bg-background/50 rounded" style={{ display: 'none' }}>
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">{document.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Click "Open in New Tab" to view this document
                    </p>
                    <Button
                      size="lg"
                      onClick={() => window.open(previewUrl || document.url, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Open Document in New Tab
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-background rounded-lg p-6 h-full overflow-auto">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-foreground">
                    {document.content ? (
                      document.content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
                        if (part.match(/^https?:\/\//)) {
                          return (
                            <a
                              key={index}
                              href={part}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline transition-colors"
                            >
                              {part}
                            </a>
                          );
                        }
                        return <span key={index}>{part}</span>;
                      })
                    ) : (
                      "Content not available for preview"
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Footer */}
          <div className="p-4 bg-background border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd> to exit fullscreen
            </p>
          </div>
        </div>
      )}
    </div>
  );
}