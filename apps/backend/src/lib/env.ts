import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../..', '.env') })

function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const env = {
  GEMINI_API_KEY: required('GEMINI_API_KEY'),
  TAVILY_API_KEY: required('TAVILY_API_KEY'),
  DATABASE_URL: optional('DATABASE_URL', 'postgresql://scout:scout@localhost:5432/scout'),
  REDIS_URL: optional('REDIS_URL', 'redis://localhost:6379'),
  PORT: parseInt(optional('PORT', '3001'), 10),
  NODE_ENV: optional('NODE_ENV', 'development'),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),
}
