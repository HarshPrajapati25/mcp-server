import { Router, Request, Response, NextFunction } from 'express';
import { HumanMessage } from '@langchain/core/messages';
import { extractAuthContextMiddleware } from '../middleware/request-context.js';
import { agentGraph } from '../agent/graph.js';
import { logger } from '../middleware/logging.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/chat', extractAuthContextMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, threadId: inputThreadId, approvalStatus } = req.body;
    const authContext = (req as any).authContext;

    if (!message && !approvalStatus) {
      return res.status(400).json({
        status: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Either "message" or "approvalStatus" must be provided.'
        }
      });
    }

    const threadId = inputThreadId || (authContext ? `user-${authContext.userId}` : `session-${uuidv4()}`);
    const config = { configurable: { thread_id: threadId } };

    logger(`Processing /chat request for threadId=${threadId}`, 'info');

    const inputs: any = {
      messages: message ? [new HumanMessage({ content: message })] : [],
      userId: authContext?.userId,
      authToken: authContext?.token
    };

    if (approvalStatus === 'approved' || approvalStatus === 'rejected') {
      inputs.approvalStatus = approvalStatus;
      inputs.intent = 'CHECKOUT_EXECUTION';
    }

    const finalState = await agentGraph.invoke(inputs, config);
    const lastMsg = finalState.messages[finalState.messages.length - 1];
    const replyText = typeof lastMsg?.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg?.content);

    if (finalState.approvalRequired && finalState.approvalStatus === 'pending') {
      return res.status(200).json({
        status: 'approval_required',
        threadId,
        message: replyText,
        summary: finalState.checkoutData,
        instructions: 'Send POST /chat with { "approvalStatus": "approved", "threadId": "' + threadId + '" } to complete the order, or "rejected" to cancel.'
      });
    }

    res.status(200).json({
      status: 'success',
      threadId,
      reply: replyText,
      orderResult: finalState.orderResult || null
    });
  } catch (err: any) {
    next(err);
  }
});

export default router;
