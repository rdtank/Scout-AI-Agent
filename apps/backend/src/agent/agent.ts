import { researchGraph } from "./graph";

export interface AgentResult {
  answer: string;
  subQuestions: string[];
  steps: number;
}

export async function runAgent(query: string): Promise<AgentResult> {
  const state = await researchGraph.invoke({ query });

  return {
    answer: state.answer,
    subQuestions: state.subQuestions,
    steps: state.findings.length,
  };
}
