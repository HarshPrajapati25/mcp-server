import { MemorySaver } from '@langchain/langgraph';

export interface AgentCheckpointer {
  getSaver(): any;
}

export class InMemoryAgentCheckpointer implements AgentCheckpointer {
  private saver = new MemorySaver();

  getSaver() {
    return this.saver;
  }
}

export const defaultCheckpointer = new InMemoryAgentCheckpointer();
