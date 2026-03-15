import { describe, expect, it } from "vitest";
import { GUARDRAILS, QuerySchema, isOverStepCap, isToolAllowed } from "../guardrails";

describe("QuerySchema", () => {
  it("accepts a valid query", () => {
    const result = QuerySchema.safeParse({ query: "What is LangGraph?" });
    expect(result.success).toBe(true);
  });

  it("trims whitespace before validation", () => {
    const result = QuerySchema.safeParse({ query: "  hello world  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.query).toBe("hello world");
  });

  it("rejects a query shorter than MIN_QUERY_LENGTH", () => {
    const result = QuerySchema.safeParse({ query: "ab" });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toContain("at least");
  });

  it("rejects an empty string", () => {
    const result = QuerySchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a query longer than MAX_QUERY_LENGTH", () => {
    const result = QuerySchema.safeParse({
      query: "a".repeat(GUARDRAILS.MAX_QUERY_LENGTH + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toContain("at most");
  });

  it("accepts a query at exactly MAX_QUERY_LENGTH characters", () => {
    const result = QuerySchema.safeParse({
      query: "a".repeat(GUARDRAILS.MAX_QUERY_LENGTH),
    });
    expect(result.success).toBe(true);
  });
});

describe("isOverStepCap", () => {
  it("returns false when below the cap", () => {
    expect(isOverStepCap(0)).toBe(false);
    expect(isOverStepCap(GUARDRAILS.MAX_RESEARCH_STEPS - 1)).toBe(false);
  });

  it("returns true at exactly the cap", () => {
    expect(isOverStepCap(GUARDRAILS.MAX_RESEARCH_STEPS)).toBe(true);
  });

  it("returns true above the cap", () => {
    expect(isOverStepCap(GUARDRAILS.MAX_RESEARCH_STEPS + 5)).toBe(true);
  });
});

describe("isToolAllowed", () => {
  it("allows all tools in the allowlist", () => {
    for (const tool of GUARDRAILS.ALLOWED_TOOLS) {
      expect(isToolAllowed(tool)).toBe(true);
    }
  });

  it("rejects tools not in the allowlist", () => {
    expect(isToolAllowed("shellExec")).toBe(false);
    expect(isToolAllowed("browserControl")).toBe(false);
    expect(isToolAllowed("")).toBe(false);
  });
});
