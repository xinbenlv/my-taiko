import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

async function screenshot(page: any, name: string) {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, name), fullPage: false });
}

test('gameplay walkthrough for demo GIF', async ({ page }) => {
  await page.goto('/');

  // 1. Title screen
  try {
    await page.waitForSelector('#btn-new-game', { timeout: 10000 });
    await page.waitForTimeout(500);
    await screenshot(page, '01-title-screen.png');
  } catch (e) {
    console.warn('Title screen capture failed:', e);
    await screenshot(page, '01-title-screen.png');
  }

  // 2. Click New Game -> Character creation
  try {
    await page.click('#btn-new-game');
    await page.waitForSelector('#creation-screen.active, #creation-screen:not(.hidden)', { timeout: 5000 });
    await page.waitForTimeout(500);
    await screenshot(page, '02-character-creation.png');
  } catch (e) {
    console.warn('Character creation capture failed:', e);
    await screenshot(page, '02-character-creation.png');
  }

  // 3. Click Begin -> Game map
  try {
    await page.click('#btn-start');
    await page.waitForSelector('#game-screen.active, #game-screen:not(.hidden)', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await screenshot(page, '03-game-map.png');
  } catch (e) {
    console.warn('Game map capture failed:', e);
    await screenshot(page, '03-game-map.png');
  }

  // 4. Open action menu and click Train
  try {
    await page.click('#btn-action');
    await page.waitForSelector('#action-menu:not(.hidden)', { timeout: 5000 });
    await page.waitForTimeout(500);
    await screenshot(page, '04-action-menu.png');
  } catch (e) {
    console.warn('Action menu capture failed:', e);
    await screenshot(page, '04-action-menu.png');
  }

  // 5. Click Train action, capture result
  try {
    await page.click('[data-action="train"]');
    await page.waitForTimeout(1000);
    await screenshot(page, '05-action-result.png');
  } catch (e) {
    console.warn('Action result capture failed:', e);
    await screenshot(page, '05-action-result.png');
  }

  // 6. Try to trigger combat via Duel
  try {
    // Close any open panel first
    const closeBtn = page.locator('.panel-close:visible');
    if (await closeBtn.count() > 0) {
      await closeBtn.first().click();
      await page.waitForTimeout(300);
    }

    await page.click('#btn-action');
    await page.waitForSelector('#action-menu:not(.hidden)', { timeout: 3000 });
    await page.click('[data-action="duel"]');
    await page.waitForTimeout(1000);

    const combatVisible = await page.locator('#combat-panel:not(.hidden)').count();
    if (combatVisible > 0) {
      await screenshot(page, '06-combat.png');
      // Click attack
      try {
        await page.click('[data-move="attack"]');
        await page.waitForTimeout(500);
        await screenshot(page, '07-combat-action.png');
      } catch { /* best effort */ }
    } else {
      await screenshot(page, '06-duel-result.png');
    }
  } catch (e) {
    console.warn('Combat capture failed:', e);
    try { await screenshot(page, '06-fallback.png'); } catch { /* ignore */ }
  }

  // Verify we got at least the core screenshots
  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
  expect(files.length).toBeGreaterThanOrEqual(3);
});
