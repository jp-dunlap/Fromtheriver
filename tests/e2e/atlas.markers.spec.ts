import { expect, test } from '@playwright/test';

test.describe('Atlas markers', () => {
  test('renders village markers on the map', async ({ page }, testInfo) => {
    await page.goto('/atlas');
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('.leaflet-marker-pane .village-dot', {
      state: 'attached',
    });

    const markers = page.locator('.leaflet-marker-pane .village-dot');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('atlas-markers', {
      body: screenshot,
      contentType: 'image/png',
    });
  });
});
