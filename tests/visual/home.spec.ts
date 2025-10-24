import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

test.describe('Visual regressions', () => {
  test('homepage remains visually stable', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width: 1280, height: 720 });
    const screenshot = await page.screenshot({ fullPage: true });
    const snapshotName = `${testInfo.project.name}-home.png`;
    const snapshotPath = testInfo.snapshotPath(snapshotName);

    if (!fs.existsSync(snapshotPath)) {
      await fs.promises.mkdir(path.dirname(snapshotPath), { recursive: true });
      await fs.promises.writeFile(snapshotPath, screenshot);
    }

    expect(screenshot).toMatchSnapshot(snapshotName);
  });
});
