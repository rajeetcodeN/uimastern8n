import React, { useState } from 'react';
import { Agent, AGENTS } from '@/types/chat';
import { Users, Check, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { PasswordPrompt } from './PasswordPrompt';

interface AgentSelectorProps {
  currentAgent: Agent | null;
  onAgentChange: (agent: Agent) => void;
}

export const AgentSelector = ({ currentAgent, onAgentChange }: AgentSelectorProps) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleAgentSelect = (agent: Agent) => {
    // If agent has no password or is already selected, switch immediately
    if (!agent.password || (currentAgent && agent.id === currentAgent.id)) {
      onAgentChange(agent);
      return;
    }
    
    // Otherwise, show password prompt
    setSelectedAgent(agent);
    setShowPasswordPrompt(true);
  };

  const handlePasswordSubmit = (password: string) => {
    if (selectedAgent && selectedAgent.password === password) {
      onAgentChange(selectedAgent);
      setShowPasswordPrompt(false);
      setAuthError('');
    } else {
      setAuthError('Incorrect password. Please try again.');
    }
  };

  const handleClosePasswordPrompt = () => {
    setShowPasswordPrompt(false);
    setAuthError('');
    setSelectedAgent(null);
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Users className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {AGENTS.map((agent) => (
            <DropdownMenuItem
              key={agent.id}
              onClick={() => handleAgentSelect(agent)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <span className="text-lg">{agent.icon}</span>
              <span className="flex-1">{agent.name}</span>
              <div className="flex items-center gap-1">
                {agent.password && <Lock className="w-3 h-3 text-muted-foreground" />}
                {currentAgent?.id === agent.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordPrompt
        isOpen={showPasswordPrompt}
        onClose={handleClosePasswordPrompt}
        onConfirm={handlePasswordSubmit}
        agentName={selectedAgent?.name || ''}
      />

      {authError && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-4 rounded-md shadow-lg max-w-sm">
          <p>{authError}</p>
        </div>
      )}
    </>
  );
};
