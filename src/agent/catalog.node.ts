import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from './agent-state.js';
import { ecomClient } from '../services/ecomClient.js';
import { logger } from '../middleware/logging.js';

export async function catalogNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  logger('Executing catalog_node', 'info');
  const lastMsg = state.messages[state.messages.length - 1];
  const query = typeof lastMsg?.content === 'string' ? lastMsg.content : '';

  try {
    const searchRes = await ecomClient.searchProducts({ query });

    const reply = new AIMessage({
      content: `Here are the product search results:\n${JSON.stringify(searchRes, null, 2)}`
    });

    return {
      messages: [reply]
    };
  } catch (err: any) {
    return {
      messages: [new AIMessage({ content: `Catalog search failed: ${err.message}` })],
      error: err.message
    };
  }
}
