export type StatusEvent = {
  type: "status";
  data: { message: string; subQuestions?: string[] };
};

export type ToolResultEvent = {
  type: "tool_result";
  data: { step: number; total: number; subQuestion: string; snippet: string };
};

export type ErrorEvent = {
  type: "error";
  data: { message: string };
};

export type DoneEvent = {
  type: "done";
  data: { answer: string };
};

export type AgentEvent = StatusEvent | ToolResultEvent | ErrorEvent | DoneEvent;

export type AppState = "idle" | "running" | "done" | "error";
