import fs from 'node:fs';
import { expect, test } from '@playwright/test';

test.describe('Atlas Codex modal', () => {
  test('opens the Codex modal when a marker is activated', async ({ page }) => {
    const villagesPayload = JSON.parse(
      fs.readFileSync('public/villages.json', 'utf8'),
    );
    await page.route('**/villages.json', (route) => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(villagesPayload),
      });
    });

    await page.goto('/atlas');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-codex-modal-root]');

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('codex:open', { detail: { slug: 'al-birwa' } }),
      );
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h3')).toHaveText(/.+/);
  });
});
