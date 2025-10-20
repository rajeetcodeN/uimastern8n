# Configuration and Integration Details

This document explains key integrations and configurations within the DBT Social application.

## 1. Chat Session ID Management

The chat functionality in `src/components/dashboard/Chat.tsx` manages user sessions using a `sessionId`. This ID is generated using `uuidv4` and persisted in the browser's `localStorage` to maintain continuity across browser sessions.

### Implementation Details

-   **State Management:** The `sessionId` is stored in a React `useState` hook.
-   **Persistence:** An `useEffect` hook ensures that the `sessionId` is saved to `localStorage` whenever it changes.
-   **Initialization:** On component mount, the `sessionId` is retrieved from `localStorage`. If no existing ID is found, a new one is generated.
-   **New Chat:** The `startNewChat` function clears messages, generates a new `sessionId`, and updates `localStorage`.

### Code Snippets

```tsx
// src/components/dashboard/Chat.tsx

const [sessionId, setSessionId] = useState<string>(
  localStorage.getItem('chatSessionId') || uuidv4()
);

// Persist session ID to localStorage when it changes
useEffect(() => {
  localStorage.setItem('chatSessionId', sessionId);
}, [sessionId]);

const startNewChat = () => {
  setMessages([]);
  const newId = uuidv4();
  setSessionId(newId);
  localStorage.setItem('chatSessionId', newId);
};
```

## 2. n8n Webhook Connection

The application communicates with an n8n webhook for processing chat messages and other AI-powered tasks. All interactions with the AI backend are routed through this webhook.

### Implementation Details

-   **Webhook URL:** The `N8N_WEBHOOK_URL` constant holds the endpoint for the n8n workflow.
-   **HTTP Method:** All requests to the webhook are `POST` requests.
-   **Headers:** Requests include `Content-Type: application/json`.
-   **Body:** The request body is a JSON string containing the `message` content, the current `sessionId`, and a `timestamp`.
-   **Asynchronous Calls:** `fetch` is used for network requests. Some calls (e.g., `sendChatMessage`) do not await the response, while others (e.g., `sendMessage`) do.
-   **Error Handling:** Basic `.catch()` blocks are used to log network errors.

### Code Snippets

```tsx
// src/components/dashboard/Chat.tsx

const N8N_WEBHOOK_URL = 'https://n8n.digitalbiz.tech/webhook/7dd3232a-1926-4cef-84a3-7287b72c561a';

// Example: Sending a chat message
const sendMessage = async () => {
  // ...existing code...
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        sessionId,
        timestamp: new Date().toISOString()
      }),
    });
    const data = await response.json();
    // ...existing code...
  } catch (err) {
    console.error('Error sending message:', err);
    // ...existing code...
  } finally {
    setLoading(false);
    setInput('');
  }
};

// Example: Processing pre-filled post data (sends message without awaiting response)
const sendChatMessage = useCallback(async (messageContent: string) => {
  // ...existing code...
  fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: messageContent,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }),
  }).catch(err => {
    console.error('Error sending message to webhook:', err);
  }).finally(() => {
    setLoading(false);
    setInput('');
  });
}, [sessionId]);
```

## 3. Supabase Table Connection

The application connects to a Supabase backend for data storage and retrieval, particularly for managing articles, blogs, and scheduled posts. The Supabase client is initialized using environment variables for security and flexibility.

### Configuration

Supabase credentials are loaded from environment variables, typically defined in a `.env` file in the project root. These variables are exposed to the Vite build process using the `VITE_` prefix.

-   `VITE_SUPABASE_URL`: The URL of your Supabase project.
-   `VITE_SUPABASE_ANON_KEY`: The `anon` public key for your Supabase project. This key is safe to be exposed in the browser.

### Client Initialization

The Supabase client is initialized once in `src/lib/supabaseClient.ts` and then exported for use throughout the application.

### Code Snippets

```typescript
// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Usage Example (from `src/pages/Automate.tsx`)

Components interact with Supabase by importing the `supabase` client and using its API to perform CRUD operations. For instance, fetching scheduled posts:

```typescript
// src/pages/Automate.tsx

import { supabase } from '@/lib/supabaseClient';

// ...existing code...

const fetchScheduledPosts = useCallback(async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .order('time_of_posting', { ascending: true });

  if (error) {
    console.error('Error fetching scheduled posts:', error);
    setPosts([]);
  } else {
    setPosts(data || []);
  }
  setLoading(false);
}, []);
```

