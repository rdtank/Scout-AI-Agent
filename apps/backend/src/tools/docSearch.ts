import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

const schema = z.object({
  query: z.string(),
  userId: z.string().optional(),
})

type Input = { query: string; userId?: string }

// Stub — wired to pgvector RAG in Phase 6
// @ts-expect-error TS2589: known @langchain/core deep-instantiation issue with Zod schemas
export const docSearchTool: DynamicStructuredTool = new DynamicStructuredTool({
  name: 'docSearch',
  description:
    'Search previously saved research documents for a user. Returns relevant excerpts from past research sessions.',
  schema,
  func: async (_input: Input): Promise<string> => {
    return 'No documents found. (Document search will be available after memory is set up in Phase 6.)'
  },
})
