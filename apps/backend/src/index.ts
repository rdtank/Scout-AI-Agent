import cors from "cors";
import express from "express";
import helmet from "helmet";
import agentRouter from "./api/routes/agent";
import docsRouter from "./api/routes/docs";
import healthRouter from "./api/routes/health";
import { env } from "./lib/env";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/agent", agentRouter);
app.use("/api/docs", docsRouter);

app.listen(env.PORT, () => {
  console.log(`Scout backend running on http://localhost:${env.PORT}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});
