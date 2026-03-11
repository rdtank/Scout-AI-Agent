import { IRouter, Request, Response, Router } from "express";
import { pool } from "../../lib/db";
import { embeddings } from "../../lib/embeddings";

const router: IRouter = Router();

router.post("/ingest", async (req: Request, res: Response) => {
  const { content, metadata } = req.body as {
    content?: string;
    metadata?: Record<string, unknown>;
  };

  if (!content?.trim()) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  try {
    const [vector] = await embeddings.embedDocuments([content]);
    const vectorLiteral = `[${vector.join(",")}]`;

    const result = await pool.query<{ id: string }>(
      `INSERT INTO documents (content, metadata, embedding)
       VALUES ($1, $2, $3::vector)
       RETURNING id`,
      [content.trim(), JSON.stringify(metadata ?? {}), vectorLiteral],
    );

    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[docs/ingest] error:", message);
    res.status(500).json({ error: message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM documents WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    res.json({ deleted: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
