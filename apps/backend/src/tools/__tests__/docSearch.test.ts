import { describe, it, expect } from 'vitest'
import { docSearchTool } from '../docSearch'

describe('docSearchTool', () => {
  it('returns stub message when no documents exist', async () => {
    const result = await docSearchTool.invoke({ query: 'AI agents' })
    expect(result).toContain('No documents found')
  })

  it('accepts an optional userId', async () => {
    const result = await docSearchTool.invoke({ query: 'research', userId: 'user-123' })
    expect(typeof result).toBe('string')
  })
})
