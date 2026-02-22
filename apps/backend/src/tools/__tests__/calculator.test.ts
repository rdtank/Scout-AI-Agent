import { describe, it, expect } from 'vitest'
import { calculatorTool } from '../calculator'

describe('calculatorTool', () => {
  it('evaluates basic arithmetic', async () => {
    const result = await calculatorTool.invoke({ expression: '2 + 2' })
    expect(result).toBe('4')
  })

  it('evaluates multiplication', async () => {
    const result = await calculatorTool.invoke({ expression: '12 * 8' })
    expect(result).toBe('96')
  })

  it('evaluates square root', async () => {
    const result = await calculatorTool.invoke({ expression: 'sqrt(144)' })
    expect(result).toBe('12')
  })

  it('evaluates percentage', async () => {
    const result = await calculatorTool.invoke({ expression: '15% * 200' })
    expect(result).toBe('30')
  })

  it('evaluates floating point division', async () => {
    const result = await calculatorTool.invoke({ expression: '10 / 4' })
    expect(result).toBe('2.5')
  })

  it('throws on invalid expression', async () => {
    await expect(calculatorTool.invoke({ expression: 'not a number' })).rejects.toThrow()
  })
})
