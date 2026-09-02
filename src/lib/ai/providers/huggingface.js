/**
 * HuggingFace API Provider – Fallback LLM for RAG
 * Uses Mixtral-8x7B-Instruct
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const HF_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const HF_FALLBACK_MODEL = 'google/flan-t5-xxl';
const HF_FALLBACK_URL = `https://api-inference.huggingface.co/models/${HF_FALLBACK_MODEL}`;

/**
 * Call HuggingFace API
 */
export async function callHuggingFace(messages, options = {}) {
  if (!HF_TOKEN) {
    console.warn('HuggingFace token missing.');
    return null;
  }

  // Convert messages to HF format (single prompt)
  const prompt = messages.map(m => {
    if (m.role === 'system') return `System: ${m.content}`;
    if (m.role === 'user') return `User: ${m.content}`;
    if (m.role === 'assistant') return `Assistant: ${m.content}`;
    return m.content;
  }).join('\n');

  const fullPrompt = `${prompt}\nAssistant:`;

  try {
    console.log('🟡 Calling HuggingFace API...');
    
    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.95,
          do_sample: true,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 503) {
        // Model is loading, wait and retry
        console.warn('HF model loading, waiting...');
        await new Promise(r => setTimeout(r, 3000));
        return callHuggingFace(messages, options);
      }
      const error = await response.text();
      console.error('HF API error:', error);
      throw new Error(`HF API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ HuggingFace response received');
    
    let content = '';
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      content = data[0].generated_text;
    } else if (data.generated_text) {
      content = data.generated_text;
    } else {
      throw new Error('Unexpected HF response format');
    }

    return {
      content: content.trim(),
      model: HF_MODEL,
    };
  } catch (error) {
    console.error('HF call failed:', error);
    
    // Try fallback model
    return callHuggingFaceFallback(messages, options);
  }
}

/**
 * Fallback to smaller HF model
 */
async function callHuggingFaceFallback(messages, options = {}) {
  if (!HF_TOKEN) return null;

  const prompt = messages.map(m => {
    if (m.role === 'system') return `System: ${m.content}`;
    if (m.role === 'user') return `User: ${m.content}`;
    if (m.role === 'assistant') return `Assistant: ${m.content}`;
    return m.content;
  }).join('\n');

  const fullPrompt = `${prompt}\nAssistant:`;

  try {
    console.log('🟡 Calling HuggingFace fallback (Flan-T5-XXL)...');
    
    const response = await fetch(HF_FALLBACK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: options.maxTokens || 300,
          temperature: 0.3,
          do_sample: true,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HF fallback error: ${response.status}`);
    }

    const data = await response.json();
    let content = '';
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      content = data[0].generated_text;
    } else if (data.generated_text) {
      content = data.generated_text;
    }

    return {
      content: content.trim(),
      model: HF_FALLBACK_MODEL,
    };
  } catch (error) {
    console.error('HF fallback failed:', error);
    return null;
  }
}

export default { callHuggingFace };
