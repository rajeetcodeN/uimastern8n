# Agent Switching with Password Protection

## Overview
This document explains how the agent switching system with password protection works in the application, including the special handling for the Travel AI agent.

## Agent Configuration
Agents are defined in `src/types/chat.ts` as an array of `Agent` objects. Each agent has the following properties:

- `id`: Unique identifier
- `name`: Display name
- `webhookUrl`: Endpoint for the agent's functionality (can be empty for redirect-only agents)
- `icon`: Visual representation
- `password`: Optional password for access control

## Implementation Details

### 1. Agent Selection Flow

#### AgentSelector Component (`AgentSelector.tsx`)
- Displays a dropdown menu of available agents
- Shows a lock icon (🔒) next to password-protected agents
- Handles agent selection logic
- Special handling for agents with redirect functionality

#### Password Protection
When a user selects an agent:
1. If the agent has no password or is already selected, switches immediately
2. If the agent has a password, shows the password prompt
3. Validates the password before performing any actions
4. For the Travel AI agent, shows a redirect dialog and navigates to the external URL

### 2. Special Agent: Travel AI
- **ID**: `travel`
- **Name**: Travel AI
- **Password**: `travel123`
- **Behavior**:
  - When selected and password is entered correctly:
    1. Shows a "Redirecting to Travel AI Tool" dialog
    2. Automatically redirects to `https://n8n-traveler.vercel.app/` after 2 seconds
  - No webhook URL is used for this agent

### 3. Password Prompt Component (`PasswordPrompt.tsx`)
- Displays a modal dialog for password entry
- Includes form validation
- Provides feedback for incorrect passwords
- Allows cancellation of the operation

## Implementation Steps (2023-11-12)

### 1. Added Travel AI Agent
- Added to `src/types/chat.ts` in the `AGENTS` array:
  ```typescript
  {
    id: 'travel',
    name: 'Travel AI',
    webhookUrl: '',
    icon: '✈️',
    password: 'travel123'
  }
  ```

### 2. Updated AgentSelector Component
- Added redirection logic for the Travel AI agent
- Implemented a redirect dialog with a loading spinner
- Handled the redirection flow separately from other agents

### 3. Security Implementation
- Password is checked client-side (note: for production, this should be server-side)
- Error handling for incorrect passwords
- Cleanup of state after operations

## Security Considerations

### Current Implementation
- Passwords are stored in plaintext in the frontend code
- No rate limiting on password attempts
- No session management
- Client-side password validation (not secure for production)

### Recommended Improvements
1. Move password validation to the backend
2. Implement proper authentication flows
3. Use environment variables for sensitive data
4. Add rate limiting
5. Implement proper session management
6. Hash passwords before storage
7. Use HTTPS for all API calls

## Example Agent Definitions

### Standard Agent
```typescript
{
  id: 'sap',
  name: 'SAP Agent',
  webhookUrl: 'https://example.com/webhook/sap',
  icon: '🔷',
  password: 'sap123' // Insecure - should be handled by backend
}
```

### Redirect-Only Agent (Travel AI)
```typescript
{
  id: 'travel',
  name: 'Travel AI',
  webhookUrl: '', // Empty for redirect-only agents
  icon: '✈️',
  password: 'travel123' // Password still required for access
}
```

## Components

### AgentSelector.tsx
Handles the agent selection UI, password verification, and special redirection flows.

### PasswordPrompt.tsx
A reusable modal dialog for password entry.

## Usage
1. Import and use the `AgentSelector` component in your layout
2. Pass the current agent and an `onAgentChange` handler
3. The component handles the rest of the flow automatically

## Rollback Instructions
To revert the Travel AI agent implementation:
1. Remove the Travel AI agent from the `AGENTS` array in `src/types/chat.ts`
2. Revert changes in `AgentSelector.tsx` to remove redirection logic
3. Remove any unused imports and state variables

## Notes
- This implementation is for demonstration purposes only
- Not suitable for production use without additional security measures
- Consider implementing proper authentication and authorization for production use
