import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph';

export const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  userId: Annotation<string | number | undefined>(),
  authToken: Annotation<string | undefined>(),
  intent: Annotation<string | undefined>(),
  selectedProduct: Annotation<any | undefined>(),
  cart: Annotation<any | undefined>(),
  checkoutData: Annotation<any | undefined>(),
  approvalRequired: Annotation<boolean | undefined>(),
  approvalStatus: Annotation<'pending' | 'approved' | 'rejected' | undefined>(),
  orderResult: Annotation<any | undefined>(),
  error: Annotation<string | undefined>()
});

export type AgentStateType = typeof AgentStateAnnotation.State;
