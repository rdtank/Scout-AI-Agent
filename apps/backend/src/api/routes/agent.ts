import { IRouter, Request, Response, Router } from "express";
import { runAgent } from "../../agent/agent";

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
    console.error("[agent] error:", message);
    res.status(500).json({ error: message });
  }
});

// Placeholder for Phase 5 SSE streaming
router.post("/stream", (_req: Request, res: Response) => {
  res.status(501).json({ error: "SSE streaming coming in Phase 5" });
});

export default router;
