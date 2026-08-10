import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from './agent-state.js';
import { ecomClient } from '../services/ecomClient.js';
import { logger } from '../middleware/logging.js';

export async function checkoutSummaryNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  logger('Executing checkout_summary_node', 'info');

  if (!state.authToken || !state.userId) {
    return {
      messages: [new AIMessage({ content: 'Authentication required: Please provide a valid Bearer JWT to proceed to checkout.' })],
      error: 'AUTHENTICATION_REQUIRED'
    };
  }

  try {
    const cartRes = await ecomClient.manageCart({ action: 'view' });

    const items = cartRes?.cart?.items || [];
    const subtotal = cartRes?.cart?.subtotal_sar || 0;
    const deliveryCharges = cartRes?.cart?.shipping_sar || 0;
    const total = cartRes?.cart?.grand_total_sar || 0;

    const checkoutSummary = {
      items,
      subtotal: String(subtotal),
      tax: '0.00',
      deliveryCharges: String(deliveryCharges),
      total: String(total)
    };

    const promptText = `Order Summary Breakdown:\n` +
      `- Items: ${items.length}\n` +
      `- Subtotal: SAR ${checkoutSummary.subtotal}\n` +
      `- Delivery Fee: SAR ${checkoutSummary.deliveryCharges}\n` +
      `- Taxes: SAR ${checkoutSummary.tax}\n` +
      `-----------------------------\n` +
      `Your total order amount is SAR ${checkoutSummary.total}. Would you like to confirm and place this order?`;

    return {
      checkoutData: checkoutSummary,
      approvalRequired: true,
      approvalStatus: 'pending',
      messages: [new AIMessage({ content: promptText })]
    };
  } catch (err: any) {
    return {
      messages: [new AIMessage({ content: `Failed to calculate checkout summary: ${err.message}` })],
      error: err.message
    };
  }
}
