import fs from "node:fs";
import { expect, test } from "@playwright/test";

const villagesPayload = JSON.parse(
  fs.readFileSync("public/villages.json", "utf8"),
);

test.describe("Atlas Codex modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/villages.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(villagesPayload),
      });
    });
  });

  test("deep-link slug opens the Codex modal on /atlas", async ({ page }) => {
    await page.goto("/atlas?slug=al-birwa");
    await page.waitForSelector("[data-codex-modal-root]", { state: "attached" });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const url = new URL(page.url());
    expect(url.pathname).toBe("/atlas");
    expect(url.searchParams.get("slug")).toBe("al-birwa");
  });

  test("closing the modal clears ?slug but stays on /atlas", async ({ page }) => {
    await page.goto("/atlas?slug=al-birwa");
    await page.waitForSelector("[data-codex-modal-root]", { state: "attached" });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.getByRole("button", { name: "Close modal" }).click();
    await expect(dialog).toBeHidden();

    const url = new URL(page.url());
    expect(url.pathname).toBe("/atlas");
    expect(url.searchParams.get("slug")).toBeNull();
  });

  test("?village query resolves to the matching slug and opens the modal", async ({
    page,
  }) => {
    await page.goto("/atlas?village=Bayt%20Daras");
    await page.waitForSelector("[data-codex-modal-root]", { state: "attached" });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const url = new URL(page.url());
    expect(url.pathname).toBe("/atlas");
    expect(url.searchParams.get("slug")).toBe("bayt-daras");
    expect(url.searchParams.has("village")).toBe(false);
  });

  test("loader falls back when /manifest.json is rewritten to HTML", async ({ page }) => {
    await page.route("**/manifest.json", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><html><body>not manifest</body></html>",
      });
    });

    const fallbackManifest = fs.existsSync("dist/.vite/manifest.json")
      ? fs.readFileSync("dist/.vite/manifest.json", "utf8")
      : null;

    await page.route("**/.vite/manifest.json", async (route) => {
      if (fallbackManifest) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: fallbackManifest,
        });
        return;
      }

      await route.continue();
    });

    await page.goto("/atlas?slug=al-birwa");
    await page.waitForSelector("[data-codex-modal-root]", { state: "attached" });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const url = new URL(page.url());
    expect(url.pathname).toBe("/atlas");
    expect(url.searchParams.get("slug")).toBe("al-birwa");
  });
});
