import { useRef, useState } from "react";
import type { AgentEvent, AppState } from "../types";

export function useAgentStream() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [answer, setAnswer] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    const query = (formData.get("query") as string)?.trim();
    if (!query) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setAppState("running");
    setEvents([]);
    setAnswer("");

    try {
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const response = await fetch(`${apiBase}/api/agent/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: ctrl.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as AgentEvent;
            if (event.type === "done") {
              setAnswer(event.data.answer);
              setAppState("done");
            } else if (event.type === "error") {
              setAppState("error");
              setEvents((prev) => [...prev, event]);
            } else {
              setEvents((prev) => [...prev, event]);
            }
          } catch {
            // malformed SSE line — skip
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setAppState("error");
        setEvents((prev) => [
          ...prev,
          { type: "error", data: { message: err.message } },
        ]);
      }
    }

    formRef.current?.reset();
  }

  return { appState, events, answer, handleAction, formRef };
}
