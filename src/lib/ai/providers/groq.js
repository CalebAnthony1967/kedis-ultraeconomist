/**
 * Groq API Provider – Primary LLM for RAG
 * Uses Llama 3.3 70B (free tier available)
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Call Groq API with conversation history
 */
export async function callGroq(messages, options = {}) {
  if (!GROQ_API_KEY || GROQ_API_KEY.startsWith('gsk_PASTE')) {
    console.warn('Groq API key missing or placeholder.');
    return null;
  }

  try {
    console.log('🟢 Calling Groq API...');
    
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || GROQ_MODEL,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 800,
        top_p: options.topP || 0.95,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', error);
      throw new Error(`Groq API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ Groq response received');
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
    };
  } catch (error) {
    console.error('Groq call failed:', error);
    return null;
  }
}

/**
 * Stream response from Groq
 */
export async function streamGroq(messages, onChunk, options = {}) {
  if (!GROQ_API_KEY || GROQ_API_KEY.startsWith('gsk_PASTE')) {
    console.warn('Groq API key missing or placeholder.');
    return null;
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model || GROQ_MODEL,
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 800,
        top_p: options.topP || 0.95,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API error: ${response.status} - ${error.error?.message || 'Unknown error'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              onChunk?.(content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Groq stream failed:', error);
    return null;
  }
}

export default { callGroq, streamGroq };
