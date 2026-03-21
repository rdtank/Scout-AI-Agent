import { IRouter, Request, Response, Router } from "express";
import { runAgent } from "../../agent";
import { researchGraph } from "../../agent/graph";
import { QuerySchema } from "../../agent/guardrails";

const router: IRouter = Router();

router.post("/run", async (req: Request, res: Response) => {
  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { query } = parsed.data;
  const userId =
    typeof req.body.userId === "string" && req.body.userId.trim()
      ? req.body.userId.trim()
      : "anonymous";
  try {
    const result = await runAgent(query, userId);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent/run] error:", message);
    res.status(500).json({ error: message });
  }
});

router.post("/stream", async (req: Request, res: Response) => {
  const parsed = QuerySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { query } = parsed.data;
  const userId =
    typeof req.body.userId === "string" && req.body.userId.trim()
      ? req.body.userId.trim()
      : "anonymous";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  function send(type: string, data: Record<string, unknown>) {
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  }

  const STREAM_TIMEOUT_MS = 120_000;
  const timeoutId = setTimeout(() => {
    console.error("[agent/stream] timed out after 120s");
    try {
      send("error", { message: "Research timed out. Please try again." });
      res.end();
    } catch {
      // already closed
    }
  }, STREAM_TIMEOUT_MS);

  try {
    let subQuestions: string[] = [];

    send("status", { message: "Starting research..." });

    const stream = await researchGraph.stream(
      { query, userId },
      { streamMode: "updates" },
    );

    for await (const rawChunk of stream) {
      const chunk = rawChunk as Record<string, Record<string, unknown>>;
      const nodeName = Object.keys(chunk)[0];
      const update = chunk[nodeName];

      if (nodeName === "planner") {
        subQuestions = (update.subQuestions as string[]) ?? [];
        send("status", { message: "Research plan ready", subQuestions });
      } else if (nodeName === "researcher") {
        const idx = ((update.currentIndex as number) ?? 1) - 1;
        const findings = update.findings as string[] | undefined;
        send("tool_result", {
          step: idx + 1,
          total: subQuestions.length,
          subQuestion: subQuestions[idx] ?? "",
          snippet: findings?.[0]?.slice(0, 400) ?? "",
        });
      } else if (nodeName === "synthesizer") {
        send("done", { answer: (update.answer as string) ?? "" });
      }
    }

    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent/stream] error:", message);
    try {
      send("error", { message });
      res.end();
    } catch {
      // client already disconnected
    }
  } finally {
    clearTimeout(timeoutId);
  }
});

export default router;
