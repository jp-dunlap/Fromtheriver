import { expect, test } from '@playwright/test';

async function ensureVillageMarkers(page: import('@playwright/test').Page) {
  // Wait until clusters or markers render, then zoom into the first cluster until dots appear
  await page.waitForFunction(() =>
    document.querySelectorAll('.marker-cluster, .leaflet-marker-pane .village-dot').length > 0,
  );

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const dotCount = await page.locator('.leaflet-marker-pane .village-dot').count();
    if (dotCount > 0) {
      return;
    }

    const cluster = page.locator('.marker-cluster').first();
    if (await cluster.count()) {
      await cluster.click();
      await page.waitForTimeout(400);
    } else {
      break;
    }
  }
}

test.describe('Atlas markers', () => {
  test('renders village markers on the map', async ({ page }, testInfo) => {
    await page.goto('/atlas');
    await page.waitForLoadState('networkidle');

    await ensureVillageMarkers(page);

    const markers = page.locator('.leaflet-marker-pane .village-dot');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('atlas-markers', {
      body: screenshot,
      contentType: 'image/png',
    });
  });

  test('opens Codex modal when clicking a village marker', async ({ page }) => {
    await page.goto('/atlas');
    await page.waitForLoadState('networkidle');

    await ensureVillageMarkers(page);
    const marker = page.locator('.leaflet-marker-pane .village-dot').first();
    await marker.waitFor({ state: 'visible' });
    await marker.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h3')).toHaveText(/.+/);
    expect(page.url()).toContain('/atlas');
  });
});
