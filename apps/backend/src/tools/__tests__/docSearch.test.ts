import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/db", () => ({
  pool: { query: vi.fn() },
}));

vi.mock("../../lib/embeddings", () => ({
  embeddings: { embedDocuments: vi.fn() },
}));

vi.mock("../../lib/env", () => ({
  env: {
    GEMINI_API_KEY: "test-key",
    TAVILY_API_KEY: "test-key",
    DATABASE_URL: "postgresql://test",
    PORT: 3001,
    NODE_ENV: "test",
    REDIS_URL: "",
    FRONTEND_URL: "http://localhost:5173",
  },
}));

import { pool } from "../../lib/db";
import { embeddings } from "../../lib/embeddings";
import { docSearchTool } from "../docSearch";

const mockQuery = vi.mocked(pool.query);
const mockEmbed = vi.mocked(embeddings.embedDocuments);

beforeEach(() => {
  vi.clearAllMocks();
  mockEmbed.mockResolvedValue([new Array(768).fill(0.1)]);
});

describe("docSearchTool", () => {
  it("returns formatted results with relevance scores", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          content: "LangGraph is a library for building agent graphs.",
          metadata: {},
          similarity: 0.92,
        },
        {
          content: "It supports stateful multi-agent workflows.",
          metadata: {},
          similarity: 0.85,
        },
      ],
      rowCount: 2,
    } as never);

    const result = await docSearchTool.invoke({ query: "What is LangGraph?" });

    expect(result).toContain("[1]");
    expect(result).toContain("92.0%");
    expect(result).toContain("LangGraph is a library");
    expect(result).toContain("[2]");
    expect(result).toContain("85.0%");
  });

  it("returns empty message when no documents match", async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never);

    const result = await docSearchTool.invoke({ query: "obscure topic" });

    expect(result).toBe("No relevant documents found in the knowledge base.");
  });

  it("passes k to the SQL query limit", async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as never);

    await docSearchTool.invoke({ query: "test", k: 10 });

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("LIMIT"),
      expect.arrayContaining([10]),
    );
  });

  it("returns graceful error message when db is unavailable", async () => {
    mockQuery.mockRejectedValue(new Error("ECONNREFUSED"));

    const result = await docSearchTool.invoke({ query: "test" });

    expect(result).toContain("docSearch unavailable");
    expect(result).toContain("ECONNREFUSED");
  });
});
