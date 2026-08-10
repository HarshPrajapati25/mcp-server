import { AgentStateType } from './agent-state.js';
import { logger } from '../middleware/logging.js';

export async function intentRouterNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const text = lastMessage ? (typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content)).toLowerCase() : '';

  logger(`Intent router evaluating input text: "${text.slice(0, 50)}..."`, 'info');

  if (state.approvalStatus === 'approved' || state.approvalStatus === 'rejected') {
    return { intent: 'CHECKOUT_EXECUTION' };
  }

  if (text.includes('checkout') || text.includes('buy') || text.includes('place order') || text.includes('order total')) {
    return { intent: 'CHECKOUT_SUMMARY' };
  } else if (text.includes('cart') || text.includes('basket') || text.includes('add to cart')) {
    return { intent: 'CART' };
  } else if (text.includes('track') || text.includes('status of order') || text.includes('where is my order')) {
    return { intent: 'TRACK_ORDER' };
  } else {
    return { intent: 'CATALOG' };
  }
}
