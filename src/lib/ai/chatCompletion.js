import openai, { validateOpenAIKey } from './openai.js';

const DEFAULT_MODEL = 'gpt-3.5-turbo';
const TEMPERATURE = 0.3; // Low temperature for factual responses

/**
 * Generate AI response for chat
 */
export async function generateChatResponse(messages, options = {}) {
  validateOpenAIKey();

  const {
    model = DEFAULT_MODEL,
    temperature = TEMPERATURE,
    maxTokens = 800,
    stream = false
  } = options;

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream
    });

    if (stream) {
      return response; // Return stream object
    }

    return {
      content: response.choices[0].message.content,
      finishReason: response.choices[0].finish_reason,
      tokensUsed: {
        prompt: response.usage.prompt_tokens,
        completion: response.usage.completion_tokens,
        total: response.usage.total_tokens
      },
      model: response.model
    };
  } catch (error) {
    console.error('Chat completion error:', error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error('AI service quota exceeded. Please try again later.');
    }
    
    if (error.code === 'context_length_exceeded') {
      throw new Error('Message too long. Please shorten your question.');
    }
    
    throw new Error('Failed to generate response');
  }
}

/**
 * Build messages array for context-aware chat
 */
export function buildChatMessages(userQuery, contextText, chatHistory = []) {
  const messages = [
    {
      role: 'system',
      content: `You are an AI academic assistant for GTU (Gujarat Technological University) students. Your primary role is to help students understand course material by answering questions based strictly on uploaded textbooks, notes, and study materials.

KEY RESPONSIBILITIES:
1. Answer questions ONLY using the provided course material
2. If information is not in the material, clearly state: "This topic is not covered in the uploaded course material."
3. Provide clear, educational explanations suitable for engineering students
4. Cite sources when referencing specific information
5. Never make up or hallucinate information

RESPONSE GUIDELINES:
- Be concise but thorough
- Use simple language and examples when explaining complex topics
- Break down difficult concepts into understandable parts
- If asked about topics not in the material, politely decline and suggest the student consult their professor or textbook

Remember: Accuracy is more important than having an answer to everything.`
    }
  ];

  // Add recent chat history (last 5 exchanges for context)
  const recentHistory = chatHistory.slice(-10); // Last 10 messages (5 exchanges)
  messages.push(...recentHistory);

  // Add current context and query
  messages.push({
    role: 'user',
    content: contextText || userQuery
  });

  return messages;
}

/**
 * Validate AI response to ensure it follows guidelines
 */
export function validateResponse(response, hasContext) {
  // Check if AI is making up information when no context exists
  if (!hasContext) {
    const lowercaseResponse = response.toLowerCase();
    const disclaimerPhrases = [
      'not covered',
      'not available',
      'no information',
      'uploaded material',
      'course material'
    ];

    const hasDisclaimer = disclaimerPhrases.some(phrase => 
      lowercaseResponse.includes(phrase)
    );

    if (!hasDisclaimer) {
      // AI might be hallucinating
      return {
        isValid: false,
        correctedResponse: "I don't have any uploaded course material related to your question. Please ensure that relevant study materials have been uploaded for your subject, or try asking about topics covered in the available materials."
      };
    }
  }

  return {
    isValid: true,
    correctedResponse: response
  };
}