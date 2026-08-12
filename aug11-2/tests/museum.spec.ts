import { expect, test } from '@playwright/test';

test('loads the 3D museum and curatorial interface', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Impossible Collection/);
  await expect(page.locator('#museum')).toBeVisible();
  await expect(page.locator('.curator h1')).toContainText('The Court');
  await expect(page.locator('.gallery-nav button')).toHaveCount(5);
  await expect(page.locator('.curator-footer span').first()).toHaveText('9 works');
  await expect.poll(() => page.evaluate(() => (window as unknown as { museumReady?: boolean }).museumReady)).toBe(true);
  await expect(page.locator('#loading')).toHaveClass(/done/, { timeout: 15_000 });
});

test('no artwork overlaps an internal doorway', async ({ page }) => {
  await page.goto('/');
  const violations = await page.evaluate(() => (
    window as unknown as { museumLayout: { doorwayViolations: unknown[] } }
  ).museumLayout.doorwayViolations);
  expect(violations).toEqual([]);
});

test('can move between all five galleries', async ({ page }) => {
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
});

test('enter control dismisses the curator note', async ({ page }) => {
  await page.goto('/');
  await page.locator('#enter-gallery').click();
  await expect(page.locator('#curator')).toHaveClass(/hidden/);
  await expect(page.locator('#sound')).toHaveAttribute('aria-label', 'Toggle ambience');
});
