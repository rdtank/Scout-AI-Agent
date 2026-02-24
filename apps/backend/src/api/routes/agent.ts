import { IRouter, Request, Response, Router } from "express";

const router: IRouter = Router();

// Placeholder — wired up in Phase 3 with LangGraph
router.post("/stream", (_req: Request, res: Response) => {
  res
    .status(501)
    .json({ error: "Agent not implemented yet — coming in Phase 3" });
});

export default router;
