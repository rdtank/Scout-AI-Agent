import { IRouter, Request, Response, Router } from "express";
import { runAgent } from "../../agent";
import { researchGraph } from "../../agent/graph";

const router: IRouter = Router();

router.post("/run", async (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };
  if (!query?.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }
  try {
    const result = await runAgent(query.trim());
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[agent/run] error:", message);
    res.status(500).json({ error: message });
  }
});

router.post("/stream", async (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };
  if (!query?.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  function send(type: string, data: Record<string, unknown>) {
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  }

  try {
    let subQuestions: string[] = [];

    send("status", { message: "Starting research..." });

    const stream = await researchGraph.stream(
      { query: query.trim() },
      { streamMode: "updates" },
    );

    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      const update = chunk[nodeName] as Record<string, unknown>;

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
  }
});

export default router;
