import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { env } from "../lib/env";

const schema = z.object({
  query: z.string(),
  maxResults: z.number().optional(),
});

type Input = { query: string; maxResults?: number };

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilyResponse {
  results: SearchResult[];
}

export const webSearchTool = new DynamicStructuredTool({
  name: "webSearch",
  description:
    "Search the web for current information on a topic. Returns ranked excerpts with source URLs.",
  schema,
  func: async (input: Input): Promise<string> => {
    const maxResults = input.maxResults ?? 5;
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query: input.query,
        max_results: maxResults,
        search_depth: "basic",
        include_answer: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Tavily API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as TavilyResponse;
    const results = data.results.map(
      (r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`,
    );
    return results.join("\n\n---\n\n");
  },
});
