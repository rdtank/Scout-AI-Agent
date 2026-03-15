import { z } from "zod";

export const GUARDRAILS = {
  MAX_RESEARCH_STEPS: 8,
  MIN_QUERY_LENGTH: 3,
  MAX_QUERY_LENGTH: 500,
  ALLOWED_TOOLS: ["webSearch", "docSearch", "calculator"] as const,
} as const;

export const QuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(
      GUARDRAILS.MIN_QUERY_LENGTH,
      `Query must be at least ${GUARDRAILS.MIN_QUERY_LENGTH} characters`,
    )
    .max(
      GUARDRAILS.MAX_QUERY_LENGTH,
      `Query must be at most ${GUARDRAILS.MAX_QUERY_LENGTH} characters`,
    ),
});

export type QueryInput = z.infer<typeof QuerySchema>;

export function isToolAllowed(toolName: string): boolean {
  return (GUARDRAILS.ALLOWED_TOOLS as readonly string[]).includes(toolName);
}

export function isOverStepCap(currentIndex: number): boolean {
  return currentIndex >= GUARDRAILS.MAX_RESEARCH_STEPS;
}
