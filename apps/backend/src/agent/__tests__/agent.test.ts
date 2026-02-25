import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@langchain/langgraph/prebuilt", () => ({
  createReactAgent: vi.fn(),
}));

vi.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: vi.fn(),
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

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { runAgent } from "../agent";

const mockInvoke = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createReactAgent).mockReturnValue({ invoke: mockInvoke } as never);
});

describe("runAgent", () => {
  it("returns the final AI message as the answer", async () => {
    mockInvoke.mockResolvedValue({
      messages: [
        { _getType: () => "human", content: "What is 2+2?" },
        { _getType: () => "tool", content: "4" },
        { _getType: () => "ai", content: "The answer is 4." },
      ],
    });

    const result = await runAgent("What is 2+2?");
    expect(result.answer).toBe("The answer is 4.");
  });

  it("counts tool and AI messages as steps", async () => {
    mockInvoke.mockResolvedValue({
      messages: [
        { _getType: () => "human", content: "Research AI trends" },
        { _getType: () => "ai", content: "" }, // reasoning step
        { _getType: () => "tool", content: "..." }, // tool result
        { _getType: () => "ai", content: "Here is a summary." },
      ],
    });

    const result = await runAgent("Research AI trends");
    expect(result.steps).toBe(3); // 2 ai + 1 tool
  });

  it("serializes array content from multipart Gemini responses", async () => {
    mockInvoke.mockResolvedValue({
      messages: [
        { _getType: () => "human", content: "Hello" },
        { _getType: () => "ai", content: [{ type: "text", text: "Hi there" }] },
      ],
    });

    const result = await runAgent("Hello");
    expect(result.answer).toContain("Hi there");
  });
});
