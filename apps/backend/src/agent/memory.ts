import { redis } from "../lib/redis";

export interface MemoryEntry {
  query: string;
  answer: string;
  ts: number;
}

const MAX_MEMORIES = 10;
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function loadMemories(userId: string): Promise<MemoryEntry[]> {
  if (!userId) return [];
  try {
    const items = await redis.lrange(`memory:${userId}`, 0, MAX_MEMORIES - 1);
    return items.map((item) => JSON.parse(item) as MemoryEntry);
  } catch {
    return [];
  }
}

export async function saveMemory(
  userId: string,
  query: string,
  answer: string,
): Promise<void> {
  if (!userId) return;
  try {
    const key = `memory:${userId}`;
    const entry: MemoryEntry = { query, answer, ts: Date.now() };
    await redis.lpush(key, JSON.stringify(entry));
    await redis.ltrim(key, 0, MAX_MEMORIES - 1);
    await redis.expire(key, TTL_SECONDS);
  } catch {
    // Redis unavailable — degrade silently
  }
}
