import { useState, useEffect } from "react";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { fetchDocuments, Document } from "@/lib/supabase";
import { toast } from "sonner";

export default function DataSourceManagement() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate("/");
  };

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      
      if (docs.length === 0) {
        toast.info("No documents found in the database");
      } else {
        toast.success(`Loaded ${docs.length} document(s) from database`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
            <h1 className="text-3xl font-bold">Data Source Management</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDocuments}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card className="bg-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Available Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Loading documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Documents Found</h3>
                <p className="text-muted-foreground">
                  No documents are available in the database. Make sure your Supabase configuration is correct.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Document Name</TableHead>
                  <TableHead className="text-muted-foreground">Last Modified Date</TableHead>
                  <TableHead className="text-muted-foreground">Source</TableHead>
                  <TableHead className="text-muted-foreground">Path</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-card-foreground">
                      {doc.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(doc.last_modified_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.url?.includes('drive.google.com') ? 'Google Drive' :
                       doc.url?.includes('sharepoint') ? 'SharePoint' :
                       doc.url?.includes('localhost') || doc.url?.includes('127.0.0.1') ? 'Local Upload' :
                       doc.url ? 'External' :
                       'Unknown Source'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline text-xs break-all transition-colors"
                        >
                          {doc.url}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">No URL available</span>
                      )}
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}