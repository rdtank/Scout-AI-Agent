import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/redis", () => ({
  redis: {
    lrange: vi.fn(),
    lpush: vi.fn(),
    ltrim: vi.fn(),
    expire: vi.fn(),
  },
}));

vi.mock("../../lib/env", () => ({
  env: {
    GEMINI_API_KEY: "test-key",
    TAVILY_API_KEY: "test-key",
    DATABASE_URL: "postgresql://test",
    PORT: 3001,
    NODE_ENV: "test",
    REDIS_URL: "redis://localhost:6379",
    FRONTEND_URL: "http://localhost:5173",
  },
}));

import { redis } from "../../lib/redis";
import { loadMemories, saveMemory } from "../memory";

const mockLrange = vi.mocked(redis.lrange);
const mockLpush = vi.mocked(redis.lpush);
const mockLtrim = vi.mocked(redis.ltrim);
const mockExpire = vi.mocked(redis.expire);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadMemories", () => {
  it("returns parsed entries from Redis", async () => {
    const entry = { query: "What is AI?", answer: "AI is...", ts: 1000 };
    mockLrange.mockResolvedValue([JSON.stringify(entry)]);

    const result = await loadMemories("user-1");

    expect(mockLrange).toHaveBeenCalledWith("memory:user-1", 0, 9);
    expect(result).toEqual([entry]);
  });

  it("returns empty array for empty userId", async () => {
    const result = await loadMemories("");
    expect(result).toEqual([]);
    expect(mockLrange).not.toHaveBeenCalled();
  });

  it("returns empty array when Redis throws", async () => {
    mockLrange.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await loadMemories("user-1");
    expect(result).toEqual([]);
  });

  it("returns empty array when Redis has no entries", async () => {
    mockLrange.mockResolvedValue([]);
    const result = await loadMemories("user-1");
    expect(result).toEqual([]);
  });
});

describe("saveMemory", () => {
  it("pushes entry and trims + expires the key", async () => {
    mockLpush.mockResolvedValue(1);
    mockLtrim.mockResolvedValue("OK");
    mockExpire.mockResolvedValue(1);

    await saveMemory("user-1", "What is X?", "X is Y.");

    expect(mockLpush).toHaveBeenCalledWith(
      "memory:user-1",
      expect.stringContaining("What is X?"),
    );
    expect(mockLtrim).toHaveBeenCalledWith("memory:user-1", 0, 9);
    expect(mockExpire).toHaveBeenCalledWith("memory:user-1", 604800);
  });

  it("does nothing for empty userId", async () => {
    await saveMemory("", "query", "answer");
    expect(mockLpush).not.toHaveBeenCalled();
  });

  it("silently degrades when Redis throws", async () => {
    mockLpush.mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(saveMemory("user-1", "q", "a")).resolves.toBeUndefined();
  });
});
