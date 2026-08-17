import { expect, test } from '@playwright/test';

type Wall = 'north' | 'south' | 'west' | 'east';

const displayWalls: { room: number; wall: Wall; name: string }[] = [
  { room: 0, wall: 'north', name: 'gallery-01-north' },
  { room: 0, wall: 'west', name: 'gallery-01-west' },
  { room: 0, wall: 'east', name: 'gallery-01-east' },
  { room: 1, wall: 'north', name: 'gallery-02-north' },
  { room: 1, wall: 'west', name: 'gallery-02-west' },
  { room: 1, wall: 'east', name: 'gallery-02-east' },
  { room: 2, wall: 'north', name: 'gallery-03-north' },
  { room: 2, wall: 'west', name: 'gallery-03-west' },
  { room: 2, wall: 'east', name: 'gallery-03-east' },
  { room: 3, wall: 'south', name: 'gallery-04-south' },
  { room: 3, wall: 'west', name: 'gallery-04-west' },
  { room: 3, wall: 'east', name: 'gallery-04-east' },
  { room: 4, wall: 'south', name: 'gallery-05-south' },
  { room: 4, wall: 'west', name: 'gallery-05-west' },
  { room: 4, wall: 'east', name: 'gallery-05-east' },
  { room: 5, wall: 'south', name: 'gallery-06-south' },
  { room: 5, wall: 'west', name: 'gallery-06-west' },
  { room: 5, wall: 'east', name: 'gallery-06-east' }
];

test.describe('low-resolution wall elevations', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 300 });
    await page.goto('/?debug=true&music=off');
    await expect(page.locator('#loading')).toHaveClass(/done/, { timeout: 15_000 });
    await page.addStyleTag({
      content: '.topbar,.gallery-nav,.controls,.crosshair,.grain,.curator,.gallery-guide,.art-card,#debug-tools{display:none!important}'
    });
  });

  for (const { room, wall, name } of displayWalls) {
    test(name, async ({ page }) => {
      await page.evaluate(({ room, wall }) => (
        window as unknown as { museumViewWall: (room: number, wall: Wall) => void }
      ).museumViewWall(room, wall), { room, wall });
      await page.waitForTimeout(150);
      await expect(page.locator('#museum')).toHaveScreenshot(`${name}.png`, {
        animations: 'disabled',
        maxDiffPixelRatio: 0.01,
        scale: 'css'
      });
    });
  }

  test('visible-storage-large-format-bay', async ({ page }) => {
    await page.evaluate(() => (
      window as unknown as { museumViewStorageSlot: (slot: number) => void }
    ).museumViewStorageSlot(24));
    await page.waitForTimeout(150);
    await expect(page.locator('#museum')).toHaveScreenshot('visible-storage-large-format-bay.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
      scale: 'css'
    });
  });
});
