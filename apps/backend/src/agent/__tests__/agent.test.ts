import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../graph", () => ({
  researchGraph: { invoke: vi.fn() },
}));

import { runAgent } from "../agent";
import { researchGraph } from "../graph";

const mockInvoke = vi.mocked(researchGraph.invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runAgent", () => {
  it("returns answer, subQuestions, and steps from graph state", async () => {
    mockInvoke.mockResolvedValue({
      query: "What is LangGraph?",
      subQuestions: ["What is LangGraph?", "How does LangGraph work?"],
      findings: ["LangGraph is a library...", "It works by..."],
      currentIndex: 2,
      answer: "LangGraph is a framework for building stateful agent graphs.",
    });

    const result = await runAgent("What is LangGraph?");

    expect(result.answer).toBe(
      "LangGraph is a framework for building stateful agent graphs.",
    );
    expect(result.subQuestions).toHaveLength(2);
    expect(result.steps).toBe(2);
  });

  it("maps steps to number of findings", async () => {
    mockInvoke.mockResolvedValue({
      query: "test",
      subQuestions: ["q1", "q2", "q3"],
      findings: ["f1", "f2", "f3"],
      currentIndex: 3,
      answer: "done",
    });

    const result = await runAgent("test");
    expect(result.steps).toBe(3);
  });

  it("propagates errors from the graph", async () => {
    mockInvoke.mockRejectedValue(new Error("Gemini API timeout"));

    await expect(runAgent("fail query")).rejects.toThrow("Gemini API timeout");
  });
});
