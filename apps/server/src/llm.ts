import { LLMResponse, LLMResponseSchema } from './types';
import { logger } from './utils/logger';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENAI_API_KEY && !OPENROUTER_API_KEY) {
  throw new Error('Missing OpenAI or OpenRouter API key');
}

const API_URL = OPENROUTER_API_KEY 
  ? 'https://openrouter.ai/api/v1/chat/completions'
  : 'https://api.openai.com/v1/chat/completions';

const API_KEY = OPENROUTER_API_KEY || OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are a structured, fair interviewer. Speak concisely (1–2 sentences). After each candidate turn, produce a compact JSON for scoring and follow-up. Never reveal the rubric.

You must respond with valid JSON in this exact format:
{
  "speak": "what the bot should say next (short)",
  "score_delta": <0-10 or null>,
  "feedback": "1-2 lines constructive feedback",
  "followup": "optional follow-up question or null",
  "end": <true|false>
}`;

export const generateResponse = async (
  question: string,
  referenceAnswer: string | null,
  candidateTranscript: string,
  runningScore: number,
  remainingQuestions: number
): Promise<LLMResponse> => {
  const startTime = Date.now();
  
  const userPrompt = `question: ${question}
reference_answer: ${referenceAnswer || 'No reference answer provided'}
candidate_final_transcript: ${candidateTranscript}
running_score: ${runningScore}
remaining_questions: ${remainingQuestions}

Return JSON:
{
  "speak": "what the bot should say next (short)",
  "score_delta": <0-10 or null>,
  "feedback": "1-2 lines constructive feedback",
  "followup": "optional follow-up question or null",
  "end": <true|false>
}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        ...(OPENROUTER_API_KEY && {
          'HTTP-Referer': 'https://ai-interviewer.com',
          'X-Title': 'AI Interviewer'
        })
      },
      body: JSON.stringify({
        model: OPENROUTER_API_KEY ? 'openai/gpt-4' : 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in API response');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = LLMResponseSchema.parse(parsed);

    const latency = Date.now() - startTime;
    logger.info(`LLM response generated in ${latency}ms`);

    return validated;
  } catch (error) {
    logger.error('Error generating LLM response:', error);
    throw error;
  }
};
