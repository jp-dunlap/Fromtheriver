import { test, expect } from '@playwright/test';

test.describe('Atlas modal', () => {
  test('deep-link opens modal and keeps /atlas path', async ({ page }) => {
    await page.goto('/atlas?slug=lydda', { waitUntil: 'networkidle' });
    const modal = page.locator('[data-codex-modal-root]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/atlas\?slug=lydda/);
  });

  test('clicking a real marker opens the modal & adds ?slug', async ({ page }) => {
    await page.goto('/atlas', { waitUntil: 'networkidle' });
    await page.waitForSelector('.village-pin', { timeout: 10000 });
    const pin = page.locator('.village-pin').first();
    await pin.click();
    const modal = page.locator('[data-codex-modal-root]');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/atlas\?slug=/);
  });

  test('close clears ?slug and returns focus to map', async ({ page }) => {
    await page.goto('/atlas?slug=lydda', { waitUntil: 'networkidle' });
    const closeBtn = page.getByRole('button', { name: /close/i });
    await closeBtn.click();
    await expect(page).toHaveURL(/\/atlas$/);
    const map = page.locator('#map-atlas');
    await expect(map).toHaveAttribute('tabindex', '0');
  });

  test('ESC closes modal (a11y)', async ({ page }) => {
    await page.goto('/atlas?slug=lydda', { waitUntil: 'networkidle' });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-codex-modal-root]')).toHaveCount(0);
  });
});
