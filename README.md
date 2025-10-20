# NOSTA AI

A modern, full-featured RAG (Retrieval-Augmented Generation) chat application with a three-column layout, document management, and AI integration.

## Features

### 🏗️ Architecture
- **Three-Column Layout**: Left sidebar for navigation, main chat area, and collapsible right information panel
- **Modern Dark Theme**: Clean, professional interface with minimalist design
- **Responsive Design**: Adapts to different screen sizes

### 💬 Chat Interface
- **Session Management**: Automatic session ID generation and persistence using localStorage
- **Conversation History**: Save and switch between multiple chat sessions
- **Real-time Messaging**: Send messages and receive AI responses
- **Image Support**: Display images returned from AI responses with maximize/minimize functionality
- **Clear Chat**: Easy way to clear current conversation

### 📁 Document Management
- **Document Viewer**: Embedded PDF viewer and content preview
- **Two-Tab Panel**: Viewer tab for document content, Details tab for metadata
- **Document Details**: Name, Last Modified Date, Source URL, Size, and Type
- **External Links**: Open documents in new tabs
- **Collapsible Panel**: Toggle visibility with header controls

### 🔗 Integrations
- **n8n Webhook Integration**: Send chat messages to n8n workflows
- **Supabase Integration**: Fetch document data from Supabase database
- **Session Persistence**: Maintain conversation state across browser sessions

### ⚙️ Settings
- **Configurable Webhook URL**: Set n8n webhook endpoint in settings modal
- **Environment Variables**: Support for configuration via environment variables

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rag-insight-panel-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # n8n Webhook Configuration (optional - can be set in Settings Modal)
   VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/rag-chat
   ```

4. **Start the development server**
   ```bash
npm run dev
```

## Configuration

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a `documents` table with the following schema:
   ```sql
   CREATE TABLE documents (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     last_modified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     source_url TEXT NOT NULL,
     size TEXT,
     type TEXT,
     content TEXT,
     summary TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```
3. Add your Supabase URL and anon key to the `.env` file

### n8n Webhook Setup

1. Create an n8n workflow with a webhook trigger
2. The webhook should expect the following payload:
   ```json
   {
     "chatInput": "User's input text",
     "sessionId": "UUID session identifier",
     "timestamp": "ISO 8601 timestamp"
   }
   ```
3. Configure the webhook URL in the Settings modal or environment variables

## Usage

### Starting a New Conversation
1. Click the "New Chat" button in the left sidebar
2. A new session ID will be generated automatically
3. Start typing your questions in the chat input

### Managing Documents
1. Navigate to "Data Source Management" via the database icon in the sidebar
2. View all available documents in a table format
3. Refresh the list to fetch latest data from Supabase

### Viewing Documents
1. Select a document from the "Active Data Sources" section in the sidebar
2. The right panel will show the document with two tabs:
   - **Viewer**: PDF viewer or content preview
   - **Details**: Document metadata and source information
3. Use the "Show Panel"/"Hide Panel" toggle in the main header to control visibility

### Settings Configuration
1. Click the Settings icon in the left sidebar
2. Configure the n8n webhook URL
3. Settings are saved and persist across sessions

## Technical Details

### Session Management
- Each conversation gets a unique UUID session ID
- Session IDs are persisted in browser localStorage
- New conversations generate new session IDs
- Session activity is tracked and updated

### API Integration
- **Webhook Requests**: POST requests to n8n with structured payload
- **Supabase Queries**: Fetches documents using Supabase client
- **Error Handling**: Graceful fallbacks for failed API calls

### Component Structure
```
src/
├── components/
│   ├── ChatInterface.tsx      # Main chat UI
│   ├── ChatSidebar.tsx        # Left navigation sidebar
│   ├── DocumentViewer.tsx     # Right document panel
│   └── SettingsModal.tsx      # Settings configuration
├── lib/
│   ├── session.ts            # Session management utilities
│   ├── supabase.ts           # Supabase client and queries
│   └── webhook.ts            # n8n webhook integration
├── pages/
│   ├── RagChat.tsx           # Main chat page
│   └── DataSourceManagement.tsx # Document management page
└── App.tsx                   # Application root
```

## Dependencies

- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icons
- **React Router**: Navigation
- **TanStack Query**: Data fetching
- **Supabase**: Database client
- **UUID**: Session ID generation

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
The application follows a modular architecture with clear separation of concerns:
- **Components**: Reusable UI components
- **Pages**: Route-level components
- **Lib**: Utility functions and integrations
- **Hooks**: Custom React hooks (if needed)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.