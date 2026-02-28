import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn(),
  })),
}));

vi.mock("../../tools", () => ({
  webSearchTool: { invoke: vi.fn() },
  allTools: [],
}));

vi.mock("../../lib/env", () => ({
  env: {
    GEMINI_API_KEY: "test-key",
    TAVILY_API_KEY: "test-key",
    PORT: 3001,
    NODE_ENV: "test",
    DATABASE_URL: "",
    REDIS_URL: "",
    FRONTEND_URL: "http://localhost:5173",
  },
}));

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { webSearchTool } from "../../tools";

const mockModelInvoke = vi.fn();
const mockSearchInvoke = vi.mocked(webSearchTool.invoke);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ChatGoogleGenerativeAI).mockImplementation(
    () => ({ invoke: mockModelInvoke }) as never,
  );
});

describe("planner sub-questions parsing", () => {
  it("parses clean JSON array from model response", async () => {
    // Import after mocks are set up
    const { researchGraph } = await import("../graph");

    mockModelInvoke
      // planner call
      .mockResolvedValueOnce({
        content: '["What is X?", "How does X work?"]',
      })
      // researcher call (sub-question 1)
      .mockResolvedValueOnce({ content: "X is a framework." })
      // researcher call (sub-question 2)
      .mockResolvedValueOnce({ content: "X works via graphs." })
      // synthesizer call
      .mockResolvedValueOnce({ content: "X is a graph framework." });

    mockSearchInvoke.mockResolvedValue("search result text");

    const result = await researchGraph.invoke({ query: "What is X?" });

    expect(result.subQuestions).toEqual(["What is X?", "How does X work?"]);
    expect(result.findings).toHaveLength(2);
    expect(result.answer).toBe("X is a graph framework.");
  });

  it("falls back to original query when model returns invalid JSON", async () => {
    vi.resetModules();
    const { researchGraph } = await import("../graph");

    mockModelInvoke
      // planner returns garbage
      .mockResolvedValueOnce({
        content: "I cannot break this into sub-questions.",
      })
      // researcher call
      .mockResolvedValueOnce({ content: "Some finding." })
      // synthesizer call
      .mockResolvedValueOnce({ content: "Final answer." });

    mockSearchInvoke.mockResolvedValue("results");

    const result = await researchGraph.invoke({ query: "complex query" });

    expect(result.subQuestions).toEqual(["complex query"]);
    expect(result.answer).toBe("Final answer.");
  });
});
