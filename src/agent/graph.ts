import { StateGraph, END } from '@langchain/langgraph';
import { AgentStateAnnotation, AgentStateType } from './agent-state.js';
import { intentRouterNode } from './intent-router.node.js';
import { catalogNode } from './catalog.node.js';
import { cartNode } from './cart.node.js';
import { checkoutSummaryNode } from './checkout-summary.node.js';
import { checkoutExecutionNode } from './checkout-execution.node.js';
import { trackOrderNode } from './track-order.node.js';
import { defaultCheckpointer } from './checkpointer.js';

function routeByIntent(state: AgentStateType) {
  switch (state.intent) {
    case 'CATALOG':
      return 'catalog_node';
    case 'CART':
      return 'cart_node';
    case 'CHECKOUT_SUMMARY':
      return 'checkout_summary_node';
    case 'CHECKOUT_EXECUTION':
      return 'checkout_execution_node';
    case 'TRACK_ORDER':
      return 'track_order_node';
    default:
      return 'catalog_node';
  }
}

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('intent_router', intentRouterNode)
  .addNode('catalog_node', catalogNode)
  .addNode('cart_node', cartNode)
  .addNode('checkout_summary_node', checkoutSummaryNode)
  .addNode('checkout_execution_node', checkoutExecutionNode)
  .addNode('track_order_node', trackOrderNode)
  .addEdge('__start__', 'intent_router')
  .addConditionalEdges('intent_router', routeByIntent, {
    catalog_node: 'catalog_node',
    cart_node: 'cart_node',
    checkout_summary_node: 'checkout_summary_node',
    checkout_execution_node: 'checkout_execution_node',
    track_order_node: 'track_order_node'
  })
  .addEdge('catalog_node', END)
  .addEdge('cart_node', END)
  .addEdge('checkout_summary_node', END)
  .addEdge('checkout_execution_node', END)
  .addEdge('track_order_node', END);

export const agentGraph = workflow.compile({
  checkpointer: defaultCheckpointer.getSaver()
});
