import { ChatOpenAI } from '@langchain/openai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { logger } from '../middleware/logging.js';

export function getLLMModel(): BaseChatModel {
  const apiKey = process.env.OPENAI_API_KEY || 'mock-key';
  const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  logger(`Initializing OpenAI LLM Provider with model="${modelName}"`, 'info');
  return new ChatOpenAI({
    model: modelName,
    openAIApiKey: apiKey,
    temperature: 0.2
  }) as unknown as BaseChatModel;
}
