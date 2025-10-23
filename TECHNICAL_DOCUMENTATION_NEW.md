# Knowledge Bot - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [State Management](#state-management)
4. [API Integration](#api-integration)
   - [Webhook Configuration](#webhook-configuration)
   - [Supabase Integration](#supabase-integration)
5. [Data Flow](#data-flow)
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

## API Integration

### Webhook Configuration

#### Active Webhook Endpoints
- **Default Webhook**: `https://ssvautomate.app.n8n.cloud/webhook/03c4b591-d635-40ec-82b6-ffa42edda35f`
- **SAP Integration**: `https://nosta.app.n8n.cloud/webhook/97d71ce6-384d-455d-9dbe-48e755fc6799`
- **Legal Documents**: `https://nosta.app.n8n.cloud/webhook/8b72a299-6557-4d8c-a365-09e105d76393`
- **NOSTA Integration**: `https://nosta.app.n8n.cloud/webhook/2bb88761-54cb-49b5-9c92-f15c14cc36b6`
- **Cost Management**: `https://nosta.app.n8n.cloud/webhook/b4c843be-698d-40c6-8e31-9370f5e165e0`

#### Webhook Payload Format
```typescript
{
  "chatInput": string,      // User's message
  "sessionId": string,      // Unique session identifier
  "timestamp": string,      // ISO 8601 timestamp
  "agentId"?: string,       // Optional: Selected agent ID
  "documents"?: string[]    // Optional: Array of active document IDs
}
```

### Supabase Integration

#### Configuration
- **Base URL**: `https://ttlghsiujpokoohkhgli.supabase.co`
- **Table Name**: `n8n_metadata` (configurable via `VITE_SUPABASE_TABLE_NAME`)

#### Database Schema

##### Documents Table (`n8n_metadata`)
```sql
CREATE TABLE n8n_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_source TEXT NOT NULL,           -- Original document ID
  title TEXT NOT NULL,               -- Document title
  url TEXT,                         -- Document URL
  last_modified_date TIMESTAMP,     -- Last modified timestamp
  size TEXT,                        -- Document size
  type TEXT,                        -- Document type (pdf, doc, txt)
  content TEXT,                     -- Full text content
  summary TEXT,                     -- AI-generated summary
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE n8n_metadata ENABLE ROW LEVEL SECURITY;
```

##### Feedback Logging Table
```sql
CREATE TABLE feedback_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL,         -- Reference to the message
  feedback_type TEXT NOT NULL,      -- Type of feedback
  comment TEXT,                    -- Optional comment
  message_content TEXT,            -- Message content for context
  message_images TEXT[],           -- Array of image URLs if any
  agent_id TEXT,                   -- Agent that generated the response
  session_id TEXT,                 -- User's session ID
  user_id TEXT,                    -- Authenticated user ID (if any)
  metadata JSONB,                  -- Additional metadata
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Key Operations

1. **Fetching Documents**
```typescript
const { data, error } = await supabase
  .from('n8n_metadata')
  .select('*')
  .order('last_modified_date', { ascending: false });
```

2. **Searching Documents**
```typescript
const { data, error } = await supabase
  .from('n8n_metadata')
  .select('*')
  .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
```

3. **Submitting Feedback**
```typescript
const { data, error } = await supabase
  .from('feedback_logs')
  .insert([{
    message_id: 'msg_123',
    feedback_type: 'inaccurate_info',
    message_content: 'Original message',
    session_id: 'session_123',
    metadata: { /* additional context */ }
  }]);
```

#### Security
- Uses Row Level Security (RLS) for data protection
- Anonymous access with limited permissions
- JWT-based authentication for write operations

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
# Supabase Configuration
VITE_SUPABASE_URL=https://ttlghsiujpokoohkhgli.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0bGdoc2l1anBva29vaGtoZ2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTE0NjUsImV4cCI6MjA3MTY4NzQ2NX0.QYvhWrIYJpu30OLBCoCcrKeUZ97Ix_MCn_jDNXWlKaw
VITE_SUPABASE_TABLE_NAME=n8n_metadata

# Webhook Configuration
VITE_N8N_WEBHOOK_URL=https://ssvautomate.app.n8n.cloud/webhook/03c4b591-d635-40ec-82b6-ffa42edda35f
VITE_N8N_WEBHOOK_SAP=https://nosta.app.n8n.cloud/webhook/97d71ce6-384d-455d-9dbe-48e755fc6799
VITE_N8N_WEBHOOK_LEGAL=https://nosta.app.n8n.cloud/webhook/8b72a299-6557-4d8c-a365-09e105d76393
VITE_N8N_WEBHOOK_NOSTA=https://nosta.app.n8n.cloud/webhook/2bb88761-54cb-49b5-9c92-f15c14cc36b6
VITE_N8N_WEBHOOK_COST=https://nosta.app.n8n.cloud/webhook/b4c843be-698d-40c6-8e31-9370f5e165e0
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
