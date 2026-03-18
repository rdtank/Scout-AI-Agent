import { expect, test } from "@playwright/test";

test("shows error card when server returns an SSE error event", async ({
  page,
}) => {
  const body = [
    `data: ${JSON.stringify({ type: "status", data: { message: "Starting research..." } })}\n\n`,
    `data: ${JSON.stringify({ type: "error", data: { message: "Gemini API quota exceeded" } })}\n\n`,
  ].join("");

  await page.route("/api/agent/stream", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
      body,
    });
  });

  await page.goto("/");
  await page.getByPlaceholder("What do you want to research?").fill("What is AI?");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.locator(".activity-error")).toBeVisible();
  await expect(page.locator(".activity-error")).toContainText(
    "Gemini API quota exceeded",
  );
});

test("shows error card when server returns a non-200 status", async ({
  page,
}) => {
  await page.route("/api/agent/stream", async (route) => {
    await route.fulfill({
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Query must be at least 3 characters" }),
    });
  });

  await page.goto("/");
  await page.getByPlaceholder("What do you want to research?").fill("What is AI?");
  await page.getByRole("button", { name: "Search" }).click();

  await expect(page.locator(".activity-error")).toBeVisible();
  await expect(page.locator(".activity-error")).toContainText("Server error: 400");
});
