import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { evaluate } from 'mathjs'

const schema = z.object({
  expression: z.string(),
})

type Input = { expression: string }

// @ts-expect-error TS2589: known @langchain/core deep-instantiation issue with Zod schemas
export const calculatorTool: DynamicStructuredTool = new DynamicStructuredTool({
  name: 'calculator',
  description:
    'Evaluate a mathematical expression. Supports arithmetic, percentages, trigonometry, and unit conversions. E.g. "2 + 2", "sqrt(144)", "15% * 200".',
  schema,
  func: async (input: Input): Promise<string> => {
    if (!input.expression?.trim()) throw new Error('Expression cannot be empty')
    try {
      const result = evaluate(input.expression)
      return String(result)
    } catch (err) {
      throw new Error(`Could not evaluate "${input.expression}": ${(err as Error).message}`)
    }
  },
})
