import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { env } from "./env";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: env.GEMINI_API_KEY,
});
