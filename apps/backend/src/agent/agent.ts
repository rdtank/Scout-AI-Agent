import { HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { env } from "../lib/env";
import { allTools } from "../tools";
import { SYSTEM_PROMPT } from "./prompt";

export interface AgentResult {
  answer: string;
  steps: number;
}

function buildAgent() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: env.GEMINI_API_KEY,
    temperature: 0.1,
  });

  return createReactAgent({
    llm: model,
    tools: allTools,
    prompt: SYSTEM_PROMPT,
  });
}

export async function runAgent(query: string): Promise<AgentResult> {
  const agent = buildAgent();

  const result = await agent.invoke({
    messages: [new HumanMessage(query)],
  });

  const messages = result.messages;
  const last = messages[messages.length - 1];
  const answer =
    typeof last.content === "string"
      ? last.content
      : JSON.stringify(last.content);

  const steps = messages.filter(
    (m) => m._getType() === "ai" || m._getType() === "tool",
  ).length;

  return { answer, steps };
}
