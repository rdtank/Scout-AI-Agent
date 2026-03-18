import { expect, test } from "@playwright/test";

// Fake SSE events that represent a complete research session
const MOCK_SSE_EVENTS = [
  { type: "status", data: { message: "Starting research..." } },
  {
    type: "status",
    data: {
      message: "Research plan ready",
      subQuestions: ["What is LangGraph?", "How does LangGraph work?"],
    },
  },
  {
    type: "tool_result",
    data: {
      step: 1,
      total: 2,
      subQuestion: "What is LangGraph?",
      snippet: "LangGraph is a library for building stateful agents.",
    },
  },
  {
    type: "tool_result",
    data: {
      step: 2,
      total: 2,
      subQuestion: "How does LangGraph work?",
      snippet: "It models workflows as a StateGraph with nodes and edges.",
    },
  },
  {
    type: "done",
    data: {
      answer:
        "LangGraph is a library for building stateful, multi-actor agent applications.",
    },
  },
];

function makeSseBody(
  events: typeof MOCK_SSE_EVENTS,
): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

test.beforeEach(async ({ page }) => {
  await page.route("/api/agent/stream", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: makeSseBody(MOCK_SSE_EVENTS),
    });
  });
  await page.goto("/");
});

test("renders the search form on load", async ({ page }) => {
  await expect(
    page.getByPlaceholder("What do you want to research?"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
});

test("shows activity feed after submitting a query", async ({ page }) => {
  await page.getByPlaceholder("What do you want to research?").fill("What is LangGraph?");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.locator(".activity-feed")).toBeVisible();
  // 2 status cards + 2 tool_result cards (done event has no card)
  await expect(page.locator(".activity-card")).toHaveCount(4);
});

test("displays research plan sub-questions", async ({ page }) => {
  await page.getByPlaceholder("What do you want to research?").fill("What is LangGraph?");
  await page.getByRole("button", { name: "Search" }).click();

  const items = page.locator(".sub-questions li");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toHaveText("What is LangGraph?");
  await expect(items.nth(1)).toHaveText("How does LangGraph work?");
});

test("renders the final answer", async ({ page }) => {
  await page.getByPlaceholder("What do you want to research?").fill("What is LangGraph?");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.locator(".answer-body")).toBeVisible();
  await expect(page.locator(".answer-body")).toContainText("LangGraph is a library");
});

test("resets the form input after a successful search", async ({ page }) => {
  const input = page.getByPlaceholder("What do you want to research?");
  await input.fill("What is LangGraph?");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.locator(".answer-body")).toBeVisible();
  await expect(input).toHaveValue("");
});
