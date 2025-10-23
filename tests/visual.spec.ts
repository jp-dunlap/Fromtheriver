import { test, expect } from '@playwright/test';

test.describe('From The River visuals', () => {
  test('homepage visual regression', async ({ page }) => {
    await page.goto('/?lng=en');
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
