import { expect, test } from '@playwright/test';

test('loads the 3D museum and curatorial interface', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Impossible Collection/);
  await expect(page.locator('#museum')).toBeVisible();
  await expect(page.locator('.curator h1')).toContainText('The Court');
  await expect(page.locator('.gallery-nav button')).toHaveCount(6);
  await expect(page.locator('.curator-footer span').first()).toHaveText('9 works');
  await expect.poll(() => page.evaluate(() => (window as unknown as { museumReady?: boolean }).museumReady)).toBe(true);
  await expect(page.locator('#loading')).toHaveClass(/done/, { timeout: 15_000 });
});

test('uses a six-room concourse layout with clear doorways', async ({ page }) => {
  await page.goto('/');
  const layout = await page.evaluate(() => (
    window as unknown as { museumLayout: { doorwayViolations: unknown[]; topology: string; roomCount: number } }
  ).museumLayout);
  expect(layout.doorwayViolations).toEqual([]);
  expect(layout.topology).toBe('concourse');
  expect(layout.roomCount).toBe(6);
});

test('can teleport between all six galleries', async ({ page }) => {
  await page.goto('/');
  await page.locator('.gallery-nav button').nth(1).click();
  await expect(page.locator('.curator h1')).toContainText('Objects');
  await expect(page.locator('#room-index')).toHaveText('02');
  await expect(page.locator('.curator-footer span').first()).toHaveText('7 works');

  await page.locator('.gallery-nav button').nth(2).click();
  await expect(page.locator('.curator h1')).toContainText('Worlds');
  await expect(page.locator('#room-index')).toHaveText('03');

  await page.locator('.gallery-nav button').nth(3).click();
  await expect(page.locator('.curator h1')).toContainText('Weather');
  await expect(page.locator('.curator-footer span').first()).toHaveText('5 works');

  await page.locator('.gallery-nav button').nth(4).click();
  await expect(page.locator('.curator h1')).toContainText('Minor Gods');
  await expect(page.locator('#room-index')).toHaveText('05');
  await expect(page.locator('.gallery-nav button').nth(4)).toHaveClass(/active/);

  await page.locator('.gallery-nav button').nth(5).click();
  await expect(page.locator('.curator h1')).toContainText('Night');
  await expect(page.locator('#room-index')).toHaveText('06');
  await expect(page.locator('.curator-footer span').first()).toHaveText('6 works');
});

test('collection view presents and filters the full painting grid', async ({ page }) => {
  await page.goto('/');
  await page.locator('#collection-toggle').click();
  await expect(page.locator('#collection')).toHaveClass(/open/);
  await expect(page.locator('#collection-grid .collection-card')).toHaveCount(41);
  await expect(page.locator('#collection-total')).toHaveText('41');

  await page.locator('#collection-filters button').nth(6).click();
  await expect(page.locator('#collection-grid .collection-card')).toHaveCount(6);
  await expect(page.locator('#collection-total')).toHaveText('6');
  await expect(page.locator('#collection-grid h2').first()).toHaveText('Moonflower Keeps the Hours');

  await page.locator('#collection-grid [data-visit-room]').first().click();
  await expect(page.locator('#collection')).not.toHaveClass(/open/);
  await expect(page.locator('#room-index')).toHaveText('06');
});

test('enter control dismisses the curator note', async ({ page }) => {
  await page.goto('/');
  await page.locator('#enter-gallery').click();
  await expect(page.locator('#curator')).toHaveClass(/hidden/);
  await expect(page.locator('#sound')).toHaveAttribute('aria-label', 'Toggle ambience');
});
