import { describe, it, expect, vi, beforeEach } from 'vitest'
import { webSearchTool } from '../webSearch'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// env.ts calls process.env at import time — provide values before import
vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key')
vi.stubEnv('TAVILY_API_KEY', 'test-tavily-key')

describe('webSearchTool', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns formatted results from Tavily', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { title: 'LangGraph Docs', url: 'https://example.com/1', content: 'LangGraph is a framework...', score: 0.95 },
          { title: 'LangGraph Guide', url: 'https://example.com/2', content: 'Building agents with LangGraph...', score: 0.87 },
        ],
      }),
    })

    const result = await webSearchTool.invoke({ query: 'LangGraph tutorial' })

    expect(result).toContain('[1] LangGraph Docs')
    expect(result).toContain('https://example.com/1')
    expect(result).toContain('[2] LangGraph Guide')
  })

  it('sends correct payload to Tavily', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    })

    await webSearchTool.invoke({ query: 'test query', maxResults: 3 })

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.tavily.com/search')
    const body = JSON.parse(options.body as string)
    expect(body.query).toBe('test query')
    expect(body.max_results).toBe(3)
  })

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    await expect(webSearchTool.invoke({ query: 'test' })).rejects.toThrow('Tavily API error: 401')
  })
})
