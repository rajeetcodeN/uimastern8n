import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ttlghsiujpokoohkhgli.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0bGdoc2l1anBva29vaGtoZ2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTE0NjUsImV4cCI6MjA3MTY4NzQ2NX0.QYvhWrIYJpu30OLBCoCcrKeUZ97Ix_MCn_jDNXWlKaw";
const tableName = import.meta.env.VITE_SUPABASE_TABLE_NAME || 'n8n_metadata';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Document {
  id: string;
  id_source: string; // The actual document ID from Supabase
  title: string;
  url: string;
  last_modified_date: string;
  size?: string;
  type?: string;
  content?: string;
  summary?: string;
}

export const fetchDocuments = async (): Promise<Document[]> => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('last_modified_date', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};

export const searchDocumentsByContent = async (searchText: string): Promise<Document[]> => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return [];
  }

  try {
    // Split the search text into words for better matching
    const words = searchText.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    if (words.length === 0) {
      return [];
    }

    // Search for documents that match any of the words in title, content, or summary
    const searchConditions = words.map(word => 
      `title.ilike.%${word}%,content.ilike.%${word}%,summary.ilike.%${word}%`
    ).join(',');

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .or(searchConditions)
      .order('last_modified_date', { ascending: false });

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
};

interface FeedbackData {
  messageId: string;
  type: 'image_broken' | 'inaccurate_info' | 'irrelevant' | 'document_link_broken' | 'other';
  comment?: string;
  messageContent: string;
  messageImages?: string[];
  agentId?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export const submitFeedback = async (feedback: FeedbackData) => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return { error: 'Supabase client not initialized' };
  }

  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert([
        {
          message_id: feedback.messageId,
          feedback_type: feedback.type,
          comment: feedback.comment,
          message_content: feedback.messageContent,
          message_images: feedback.messageImages || [],
          agent_id: feedback.agentId,
          session_id: feedback.sessionId,
          user_id: feedback.userId,
          metadata: feedback.metadata || {}
        }
      ])
      .select();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return { error };
  }
};

export const searchDocumentsByExactMatch = async (searchText: string): Promise<Document[]> => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    return [];
  }

  try {
    // First try exact title matches
    const { data: exactData, error: exactError } = await supabase
      .from(tableName)
      .select('*')
      .ilike('title', `%${searchText}%`)
      .order('last_modified_date', { ascending: false });

    if (exactError) {
      console.error('Error searching documents by exact match:', exactError);
      return [];
    }

    // If we found exact matches, return them
    if (exactData && exactData.length > 0) {
      return exactData;
    }

    // If no exact matches, try broader search
    return await searchDocumentsByContent(searchText);
  } catch (error) {
    console.error('Error searching documents by exact match:', error);
    return [];
  }
};