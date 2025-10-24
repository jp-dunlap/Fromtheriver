import { expect, test } from "@playwright/test";

async function isFocusInsideModal(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) {
      return false;
    }
    const active = document.activeElement;
    return Boolean(active && dialog.contains(active));
  });
}

test.describe("Archive deep links", () => {
  test("opens codex modal and traps focus for archive slug", async ({
    page,
  }) => {
    await page.goto("/archive/al-birwa");

    const dialog = page.getByRole("dialog", { name: /al-birwa/i });
    await expect(dialog).toBeVisible();

    const heading = page.getByRole("heading", { name: /al-birwa/i });
    await expect(heading).toBeVisible();

    await expect.poll(() => isFocusInsideModal(page)).toBe(true);

    await page.keyboard.press("Tab");
    expect(await isFocusInsideModal(page)).toBe(true);

    await page.keyboard.press("Shift+Tab");
    expect(await isFocusInsideModal(page)).toBe(true);
  });

  test("feed.xml responds with RSS content type", async ({ request }) => {
    const response = await request.head("/feed.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(
      /application\/rss\+xml/i,
    );
  });

  test("archive slug responds to HEAD requests", async ({ request }) => {
    const response = await request.head("/archive/al-birwa");
    expect(response.status()).toBe(200);
  });
});
