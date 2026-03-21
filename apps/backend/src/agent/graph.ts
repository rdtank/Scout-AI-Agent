import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { env } from "../lib/env";
import { webSearchTool } from "../tools";
import { GUARDRAILS, isOverStepCap, isToolAllowed } from "./guardrails";
import { MemoryEntry, loadMemories, saveMemory } from "./memory";
import {
  PLANNER_PROMPT,
  RESEARCHER_PROMPT,
  SYNTHESIZER_PROMPT,
} from "./prompt";

const StateAnnotation = Annotation.Root({
  query: Annotation<string>(),
  userId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  memories: Annotation<MemoryEntry[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  subQuestions: Annotation<string[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  findings: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  currentIndex: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 0,
  }),
  answer: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
});

type State = typeof StateAnnotation.State;

function buildModel() {
  return new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: env.GEMINI_API_KEY,
    temperature: 0.1,
    maxRetries: 1,
  });
}

async function memoryNode(state: State): Promise<Partial<State>> {
  const memories = await loadMemories(state.userId);
  return { memories };
}

async function plannerNode(state: State): Promise<Partial<State>> {
  const model = buildModel();
  const response = await model.invoke([
    ["system", PLANNER_PROMPT],
    ["human", state.query],
  ]);

  const raw =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  // Strip markdown code fences if the model wraps the JSON
  const cleaned = raw.replace(/```(?:json)?\n?/g, "").trim();

  let subQuestions: string[];
  try {
    subQuestions = JSON.parse(cleaned);
    if (!Array.isArray(subQuestions)) throw new Error("not an array");
  } catch {
    subQuestions = [state.query];
  }

  // Guardrail: cap to MAX_RESEARCH_STEPS so the planner can never exceed the step limit
  subQuestions = subQuestions.slice(0, GUARDRAILS.MAX_RESEARCH_STEPS);

  return { subQuestions, currentIndex: 0 };
}

async function researcherNode(state: State): Promise<Partial<State>> {
  const model = buildModel();
  const question = state.subQuestions[state.currentIndex];

  // Guardrail: enforce tool allowlist at invocation time
  if (!isToolAllowed(webSearchTool.name)) {
    throw new Error(`Tool '${webSearchTool.name}' is blocked by guardrails`);
  }

  const searchResults = await webSearchTool.invoke({ query: question });

  const response = await model.invoke([
    ["system", RESEARCHER_PROMPT],
    ["human", `Sub-question: ${question}\n\nSearch results:\n${searchResults}`],
  ]);

  const summary =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  return {
    findings: [summary],
    currentIndex: state.currentIndex + 1,
  };
}

async function synthesizerNode(state: State): Promise<Partial<State>> {
  const model = buildModel();

  const findingsText = state.findings
    .map((f, i) => `[Finding ${i + 1} — ${state.subQuestions[i]}]\n${f}`)
    .join("\n\n---\n\n");

  const memoryContext =
    state.memories.length > 0
      ? `\n\nRelevant past research from this user:\n${state.memories
          .slice(0, 3)
          .map((m) => `Q: ${m.query}\nA: ${m.answer.slice(0, 300)}`)
          .join("\n\n")}`
      : "";

  const response = await model.invoke([
    ["system", SYNTHESIZER_PROMPT],
    [
      "human",
      `Original question: ${state.query}\n\nResearch findings:\n\n${findingsText}${memoryContext}`,
    ],
  ]);

  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  await saveMemory(state.userId, state.query, answer);

  return { answer };
}

function shouldContinueResearch(state: State): "researcher" | "synthesizer" {
  // Guardrail: hard step cap takes priority over the planned sub-question list
  if (isOverStepCap(state.currentIndex)) return "synthesizer";
  return state.currentIndex < state.subQuestions.length
    ? "researcher"
    : "synthesizer";
}

export const researchGraph = new StateGraph(StateAnnotation)
  .addNode("memory", memoryNode)
  .addNode("planner", plannerNode)
  .addNode("researcher", researcherNode)
  .addNode("synthesizer", synthesizerNode)
  .addEdge(START, "memory")
  .addEdge("memory", "planner")
  .addEdge("planner", "researcher")
  .addConditionalEdges("researcher", shouldContinueResearch, {
    researcher: "researcher",
    synthesizer: "synthesizer",
  })
  .addEdge("synthesizer", END)
  .compile();
