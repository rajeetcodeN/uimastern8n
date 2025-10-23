import { sessionManager } from './session';

export interface WebhookPayload {
  chatInput: string;
  sessionId: string;
  timestamp: string;
}

export interface WebhookResponse {
  success: boolean;
  response?: string;
  message?: string;
  content?: string;
  images?: string[];
  error?: string;
}

export const sendToWebhook = async (
  chatInput: string,
  webhookUrl: string,
  signal?: AbortSignal
): Promise<WebhookResponse> => {
  const sessionId = sessionManager.getSessionId();
  const timestamp = new Date().toISOString();

  const payload: WebhookPayload = {
    chatInput,
    sessionId,
    timestamp
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });
    
    // If the request was aborted, throw a specific error
    if (signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Update session activity
    sessionManager.updateActivity();

    // Debug logging
    console.log('Webhook response data:', data);

    // Extract the actual response content from various possible fields
    const actualResponse = data.response || data.message || data.content || data.text || data.answer || data.reply || data.output || data.result || 'No response content found';

    console.log('Webhook response data:', data);
    console.log('Extracted response content:', actualResponse);
    
    // If we still don't have content, try to extract from nested objects
    if (actualResponse === 'No response content found') {
      console.log('Trying to extract from nested response...');
      if (data.data && typeof data.data === 'object') {
        const nestedResponse = data.data.response || data.data.message || data.data.content || data.data.text;
        if (nestedResponse) {
          console.log('Found nested response:', nestedResponse);
          return {
            success: true,
            response: nestedResponse,
            images: data.images || data.data.images || []
          };
        }
      }
    }

    return {
      success: true,
      response: actualResponse,
      images: data.images || []
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
