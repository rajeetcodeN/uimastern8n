import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Agent } from '@/types/chat';

interface InitialAgentPromptProps {
  isOpen: boolean;
  agent: Agent;
  onAuthenticated: () => void;
}

export const InitialAgentPrompt: React.FC<InitialAgentPromptProps> = ({
  isOpen,
  agent,
  onAuthenticated,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset form when agent changes
    setPassword('');
    setError('');
  }, [agent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (agent.password === password) {
      setIsSubmitting(true);
      // Small delay to show loading state
      setTimeout(() => {
        onAuthenticated();
        setIsSubmitting(false);
      }, 500);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (!isOpen) return null;

  // Prevent closing the dialog by clicking outside or pressing escape
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to {agent.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please enter the password to continue using the {agent.name} agent.
            </p>
            <Input
              id="initial-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter password"
              autoComplete="current-password"
              autoFocus
            />
            {error && (
              <Alert variant="destructive" className="p-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Continue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
