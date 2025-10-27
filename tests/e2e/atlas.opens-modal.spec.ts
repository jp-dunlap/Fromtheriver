import fs from "node:fs";
import { expect, test } from "@playwright/test";

test.describe("Atlas Codex modal", () => {
  test("opens the Codex modal when a marker is activated", async ({ page }) => {
    const villagesPayload = JSON.parse(
      fs.readFileSync("public/villages.json", "utf8"),
    );
    await page.route("**/villages.json", (route) => {
      void route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(villagesPayload),
      });
    });

    await page.goto("/atlas");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("[data-codex-modal-root]", { state: "attached" });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("codex:open", { detail: { slug: "al-birwa" } }),
      );
    });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("h3")).toHaveText(/.+/);

    // New: ensure we did NOT navigate to /archive/:slug
    const url = new URL(page.url());
    expect(url.pathname).toBe("/atlas");
    expect(url.search).toMatch(/(^$|^\?(.+&)?slug=al-birwa(&.+)?$)/);
  });

  test("closing the Codex modal on /atlas keeps you on /atlas and clears ?slug", async ({
    page,
  }) => {
    const villagesPayload = JSON.parse(
      fs.readFileSync("public/villages.json", "utf8"),
    );
    await page.route("**/villages.json", (route) => {
      void route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(villagesPayload),
      });
    });

    await page.goto("/atlas");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("[data-codex-modal-root]", { state: "attached" });

    // Open modal
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("codex:open", { detail: { slug: "al-birwa" } }),
      );
    });
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Close via close button
    await page.getByRole("button", { name: /close modal/i }).click();

    await expect(dialog).toBeHidden();
    const url = new URL(page.url());
    expect(url.pathname).toBe("/atlas");
    expect(url.search).not.toContain("slug=");
  });
});
