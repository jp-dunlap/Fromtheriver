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
  test("static archive HTML exposes metadata", async ({ request }) => {
    const response = await request.get("/archive/al-birwa/");
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("<title>al-Birwa — From The River</title>");
    expect(html).toMatch(
      /<meta property="og:title" content="al-Birwa"\s*\/>/,
    );
    expect(html).toMatch(/<meta property="og:description"[^>]+>/);
    expect(html).toContain(
      '<meta name="twitter:card" content="summary_large_image" />',
    );
    expect(html).toContain(
      '<meta property="og:image" content="https://fromtheriver.org/og/al-birwa.svg" />',
    );
    expect(html).toContain(
      '<meta name="twitter:image" content="https://fromtheriver.org/og/al-birwa.svg" />',
    );
    expect(html).toContain(
      '<link rel="canonical" href="https://fromtheriver.org/archive/al-birwa"',
    );
  });

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

  test("archive explorer returns focus to trigger on close", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: /archive explorer/i });
    await trigger.focus();
    await expect(trigger).toBeFocused();

    await trigger.press("Enter");

    const dialog = page.getByRole("dialog", { name: /archive explorer/i });
    await expect(dialog).toBeVisible();

    await page.getByRole("button", { name: /close modal/i }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("language switcher updates locale direction via keyboard", async ({
    page,
  }) => {
    await page.goto("/");

    const languageSelect = page.getByLabel(/language/i);
    await languageSelect.focus();
    await expect(languageSelect).toBeFocused();

    await languageSelect.selectOption("ar");

    await expect.poll(() =>
      page.evaluate(() => ({
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
      })),
    ).toEqual({ lang: "ar", dir: "rtl" });

    await page.keyboard.press("Tab");
    const archiveButton = page.getByRole("button", { name: /archive explorer/i });
    await expect(archiveButton).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(languageSelect).toBeFocused();
  });

  test("feed.xml responds with RSS content type", async ({ request }) => {
    const response = await request.head("/feed.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toMatch(
      /(application\/rss\+xml|text\/xml)/i,
    );
  });

  test("archive slug responds to HEAD requests", async ({ request }) => {
    const response = await request.head("/archive/al-birwa");
    expect(response.status()).toBe(200);
  });

  test("archive page loads without CSP console violations", async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleMessages.push(message.text());
      }
    });

    await page.goto("/archive/al-birwa");

    const cspErrors = consoleMessages.filter((text) =>
      /content security policy/i.test(text),
    );
    expect(cspErrors).toHaveLength(0);
  });
});
