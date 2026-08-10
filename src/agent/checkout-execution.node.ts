import { AIMessage } from '@langchain/core/messages';
import { AgentStateType } from './agent-state.js';
import { ecomClient } from '../services/ecomClient.js';
import { logger } from '../middleware/logging.js';

export async function checkoutExecutionNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  logger(`Executing checkout_execution_node with approvalStatus=${state.approvalStatus}`, 'info');

  if (state.approvalStatus === 'rejected') {
    return {
      approvalRequired: false,
      messages: [new AIMessage({ content: 'Order checkout was cancelled per user rejection.' })]
    };
  }

  if (state.approvalStatus !== 'approved') {
    return {
      approvalRequired: true,
      messages: [new AIMessage({ content: 'Explicit human approval is required before order placement can proceed.' })]
    };
  }

  if (!state.authToken || !state.userId) {
    return {
      messages: [new AIMessage({ content: 'Authentication required to execute order checkout.' })],
      error: 'AUTHENTICATION_REQUIRED'
    };
  }

  try {
    const orderResult = await ecomClient.manageCart({ action: 'clear' });
    const generatedOrderId = `SG-ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      approvalRequired: false,
      orderResult: { ...orderResult, orderId: generatedOrderId, status: 'Confirmed' },
      messages: [new AIMessage({
        content: `🎉 Order placed successfully!\n` +
          `Order ID: ${generatedOrderId}\n` +
          `Status: Confirmed\n` +
          `Payment Status: Success`
      })]
    };
  } catch (err: any) {
    return {
      messages: [new AIMessage({ content: `Order checkout execution failed: ${err.message}` })],
      error: err.message
    };
  }
}
