// src/lib/ai/openai.js
// (keep filename so no import paths break)
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  console.warn('[Groq] WARNING: GROQ_API_KEY is not set');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;

// Available Groq models (free tier):
// 'llama3-8b-8192'        — fast, good quality
// 'llama3-70b-8192'       — best quality, slower
// 'mixtral-8x7b-32768'    — long context (32k tokens)
// 'gemma2-9b-it'          — Google's Gemma 2
// 'llama-3.1-8b-instant'  — fastest
export const GROQ_MODEL = 'llama3-8b-8192';