# Knowledge Bot - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [State Management](#state-management)
4. [Data Flow](#data-flow)
5. [API Integration](#api-integration)
6. [Local Storage](#local-storage)
7. [Error Handling](#error-handling)
8. [Internationalization](#internationalization)
9. [Configuration](#configuration)
10. [Deployment](#deployment)

## Architecture Overview

The Knowledge Bot is a React-based single-page application (SPA) built with TypeScript. It follows a component-based architecture with a clear separation of concerns between UI components, state management, and data fetching.

## Component Structure

### Core Components

1. **RagChat (pages/RagChat.tsx)**
   - Main container component
   - Manages high-level state and data flow
   - Coordinates between chat interface and sidebar

2. **ChatInterface (components/ChatInterface.tsx)**
   - Handles message display and user input
   - Manages message feedback and reporting
   - Renders message history and typing indicators

3. **ChatSidebar (components/ChatSidebar.tsx)**
   - Displays conversation history
   - Manages document uploads and selection
   - Handles conversation creation and management

4. **AgentSelector (components/chat/AgentSelector.tsx)**
   - Allows switching between different AI agents
   - Displays available agents in a dropdown

## State Management

The application uses React Context API for state management with the `ChatContext` provider.

### ChatContext (contexts/ChatContext.tsx)

#### State
- `conversations`: Array of conversation objects
- `messages`: Current conversation messages
- `conversationMessages`: Messages organized by conversation ID
- `activeConversation`: Currently selected conversation ID
- `documents`: Available documents
- `activeDataSources`: Currently active documents for the conversation
- `isLoading`: Loading state indicator

#### Key Methods
- `startNewChat()`: Creates a new conversation
- `selectConversation(id)`: Loads a specific conversation
- `addMessage(message)`: Adds a message to the current conversation
- `updateConversationTitle(id, title)`: Updates a conversation's title
- `addDocumentToActiveSources(documentId)`: Adds a document to active sources
- `removeDocumentFromActiveSources(documentId)`: Removes a document from active sources

## Data Flow

1. **User Interaction**
   - User sends a message via ChatInterface
   - Message is added to the current conversation
   - Request is sent to the appropriate API endpoint

2. **API Response**
   - Response is received and processed
   - AI response is added to the conversation
   - UI updates to show the new message

3. **Document Management**
   - Documents can be uploaded via the sidebar
   - Active documents are used to provide context for AI responses
   - Document state is managed in ChatContext

## API Integration

The application integrates with several API endpoints:

### Webhook Configuration
- Base URL: Configurable via environment variables
- Endpoints:
  - `VITE_N8N_WEBHOOK_URL`: Default webhook URL
  - `VITE_N8N_WEBHOOK_SAP`: SAP integration webhook
  - `VITE_N8N_WEBHOOK_LEGAL`: Legal documents webhook
  - `VITE_N8N_WEBHOOK_NOSTA`: NOSTA specific webhook
  - `VITE_N8N_WEBHOOK_COST`: Cost-related webhook

### Message Format
```typescript
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
```

## Local Storage

The application uses browser's localStorage for persisting:
- Conversation history
- User preferences
- Active session data

## Error Handling

- API errors are caught and displayed to the user
- Failed message sends are retried automatically
- User feedback is collected for failed operations

## Internationalization

- Supports multiple languages via the `LanguageContext`
- Text content is managed through translation keys
- Language can be changed via the language selector

## Configuration

Environment variables can be configured in `.env` files:

```env
# Webhook Configuration
VITE_N8N_WEBHOOK_URL=https://ssvautomate.app.n8n.cloud/webhook/03c4b591-d635-40ec-82b6-ffa42edda35f
VITE_N8N_WEBHOOK_SAP=https://nosta.app.n8n.cloud/webhook/97d71ce6-384d-455d-9dbe-48e755fc6799
VITE_N8N_WEBHOOK_LEGAL=https://nosta.app.n8n.cloud/webhook/8b72a299-6557-4d8c-a365-09e105d76393
VITE_N8N_WEBHOOK_NOSTA=https://nosta.app.n8n.cloud/webhook/2bb88761-54cb-49b5-9c92-f15c14cc36b6
VITE_N8N_WEBHOOK_COST=https://nosta.app.n8n.cloud/webhook/b4c843be-698d-40c6-8e31-9370f5e165e0

# Supabase Configuration
VITE_SUPABASE_URL=https://ttlghsiujpokoohkhgli.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0bGdoc2l1anBva29vaGtoZ2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTE0NjUsImV4cCI6MjA3MTY4NzQ2NX0.QYvhWrIYJpu30OLBCoCcrKeUZ97Ix_MCn_jDNXWlKaw
VITE_SUPABASE_TABLE_NAME=n8n_metadata
```

## Deployment

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Build Steps
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with required environment variables

3. Build the application:
   ```bash
   npm run build
   ```

4. Deploy the contents of the `dist` directory to your web server

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default.
