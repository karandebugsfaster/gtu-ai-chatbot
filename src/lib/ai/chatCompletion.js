import groq, { GROQ_MODEL } from './openai';

const SYSTEM_PROMPT = `You are GTU AI, an intelligent assistant specifically designed 
for Gujarat Technological University (GTU) students. You help with:
- Explaining concepts from GTU subjects
- Analyzing previous year questions (PYQs)
- Helping with exam preparation
- Answering questions based on uploaded study materials

Always provide accurate, helpful responses. If you're unsure, say so clearly.
Format your responses with proper structure when needed.`;

export async function generateChatCompletion(messages, context = null) {
  try {
    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\n--- RELEVANT STUDY MATERIAL ---\n${context}\n--- END OF MATERIAL ---\n\nAnswer based on the above material when relevant.`
      : SYSTEM_PROMPT;

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemContent },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    return content;

  } catch (error) {
    console.error('[chatCompletion] Groq error:', error.message);

    // Groq-specific error handling
    if (error.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.');
    }
    if (error.status === 401) {
      throw new Error('Invalid Groq API key. Please check your configuration.');
    }
    if (error.status === 503) {
      throw new Error('Groq service temporarily unavailable. Please try again.');
    }

    throw new Error('Failed to generate response: ' + error.message);
  }
}

// Streaming version (optional - for future use)
export async function generateChatCompletionStream(messages, context = null, onChunk) {
  try {
    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\n--- RELEVANT STUDY MATERIAL ---\n${context}\n--- END OF MATERIAL ---`
      : SYSTEM_PROMPT;

    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemContent },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullContent += delta;
      if (onChunk) onChunk(delta);
    }

    return fullContent;

  } catch (error) {
    console.error('[chatCompletion] Stream error:', error.message);
    throw error;
  }
}