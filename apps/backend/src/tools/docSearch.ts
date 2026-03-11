import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { pool } from "../lib/db";
import { embeddings } from "../lib/embeddings";

interface DocRow {
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

async function searchDocs(query: string, k: number): Promise<string> {
  const [vector] = await embeddings.embedDocuments([query]);
  const vectorLiteral = `[${vector.join(",")}]`;

  const { rows } = await pool.query<DocRow>(
    `SELECT content, metadata,
            1 - (embedding <=> $1::vector) AS similarity
     FROM documents
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vectorLiteral, k],
  );

  if (rows.length === 0) {
    return "No relevant documents found in the knowledge base.";
  }

  return rows
    .map(
      (row, i) =>
        `[${i + 1}] (relevance: ${(row.similarity * 100).toFixed(1)}%)\n${row.content}`,
    )
    .join("\n\n---\n\n");
}

export const docSearchTool = new DynamicStructuredTool({
  name: "docSearch",
  description:
    "Search the internal knowledge base using semantic similarity. Use this for company-specific information, uploaded files, or private data not available on the web.",
  schema: z.object({
    query: z.string().describe("The search query"),
    k: z
      .number()
      .optional()
      .describe("Number of results to return (default 4)"),
  }),
  func: async ({ query, k = 4 }): Promise<string> => {
    try {
      return await searchDocs(query, k);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `docSearch unavailable: ${message}`;
    }
  },
});
