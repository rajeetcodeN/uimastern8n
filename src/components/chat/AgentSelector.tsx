import React from 'react';
import { Agent, AGENTS } from '@/types/chat';
import { Users, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface AgentSelectorProps {
  currentAgent: Agent;
  onAgentChange: (agent: Agent) => void;
}

export const AgentSelector = ({ currentAgent, onAgentChange }: AgentSelectorProps) => {
  return (
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
            onClick={() => onAgentChange(agent)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-lg">{agent.icon}</span>
            <span className="flex-1">{agent.name}</span>
            {currentAgent.id === agent.id && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
