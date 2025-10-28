export interface Agent {
  id: string;
  name: string;
  webhookUrl: string;
  icon: string;
  password?: string; // Optional password for agent access
}

export const AGENTS: Agent[] = [
  {
    id: 'alt',
    name: 'Alt Agent',
    webhookUrl: 'https://nosta.app.n8n.cloud/webhook/294801bb-565e-4d46-a75d-5c4b0f26a18b',
    icon: '🔄',
    password: 'alt123'
  },
  {
    id: 'sap',
    name: 'SAP Agent',
    webhookUrl: 'https://nosta.app.n8n.cloud/webhook/97d71ce6-384d-455d-9dbe-48e755fc6799',
    icon: '🔷',
    password: 'sap123' // Example password
  },
  {
    id: 'legal',
    name: 'Legal',
    webhookUrl: 'https://nosta.app.n8n.cloud/webhook/8b72a299-6557-4d8c-a365-09e105d76393',
    icon: '⚖️',
    password: 'legal123' // Example password
  },
  {
    id: 'website',
    name: 'Website',
    webhookUrl: 'https://nosta.app.n8n.cloud/webhook/2bb88761-54cb-49b5-9c92-f15c14cc36b6',
    icon: '🌐',
    password: 'web123' // Example password
  },
  {
    id: 'cost',
    name: 'Cost Cal',
    webhookUrl: 'https://nosta.app.n8n.cloud/webhook/b4c843be-698d-40c6-8e31-9370f5e165e0',
    icon: '💰',
    password: 'cost123' // Example password
  },
];
