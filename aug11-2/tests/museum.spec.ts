import { expect, test } from '@playwright/test';

test('loads the 3D museum and curatorial interface', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Museum of Ordinary Things/);
  await expect(page.locator('#museum')).toBeVisible();
  await expect(page.locator('.curator h1')).toContainText('Portraits');
  await expect(page.locator('.gallery-nav button')).toHaveCount(7);
  await expect(page.locator('.curator-footer span').first()).toHaveText('7 works');
  await expect.poll(() => page.evaluate(() => (window as unknown as { museumReady?: boolean }).museumReady)).toBe(true);
  await expect(page.locator('#loading')).toHaveClass(/done/, { timeout: 15_000 });
});

test('uses a six-gallery concourse with a separate lower-level room', async ({ page }) => {
  await page.goto('/');
  const layout = await page.evaluate(() => (
    window as unknown as { museumLayout: { doorwayViolations: unknown[]; topology: string; roomCount: number; galleryCount: number; guideCount: number; concourseFeatureGroups: number; storage: { level: number; capacity: number; occupied: number; lightCount: number } } }
  ).museumLayout);
  expect(layout.doorwayViolations).toEqual([]);
  expect(layout.topology).toBe('concourse');
  expect(layout.roomCount).toBe(7);
  expect(layout.galleryCount).toBe(6);
  expect(layout.guideCount).toBe(6);
  expect(layout.concourseFeatureGroups).toBeGreaterThanOrEqual(6);
  expect(layout.storage).toEqual({ level: -7.5, capacity: 42, occupied: 11, lightCount: 12 });
});

test('preserves every painting aspect ratio without cropping', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/done/, { timeout: 15_000 });
  const fits = await page.evaluate(() => (
    window as unknown as { museumArtworkFits: { room: number; work: number; imageAspect: number; displayAspect: number }[] }
  ).museumArtworkFits);
  expect(fits).toHaveLength(42);
  expect(fits.every(fit => Math.abs(fit.imageAspect - fit.displayAspect) < 0.0001)).toBe(true);
});

test('can teleport between all six galleries', async ({ page }) => {
  await page.goto('/');
  await page.locator('.gallery-nav button').nth(1).click();
  await expect(page.locator('.curator h1')).toContainText('Domestic');
  await expect(page.locator('#room-index')).toHaveText('02');
  await expect(page.locator('.curator-footer span').first()).toHaveText('5 works');

  await page.locator('.gallery-nav button').nth(2).click();
  await expect(page.locator('.curator h1')).toContainText('Outer');
  await expect(page.locator('#room-index')).toHaveText('03');
  await expect(page.locator('.curator-footer span').first()).toHaveText('6 works');

  await page.locator('.gallery-nav button').nth(3).click();
  await expect(page.locator('.curator h1')).toContainText('Weather');
  await expect(page.locator('.curator-footer span').first()).toHaveText('4 works');

  await page.locator('.gallery-nav button').nth(4).click();
  await expect(page.locator('.curator h1')).toContainText('Working');
  await expect(page.locator('#room-index')).toHaveText('05');
  await expect(page.locator('.curator-footer span').first()).toHaveText('5 works');
  await expect(page.locator('.gallery-nav button').nth(4)).toHaveClass(/active/);

  await page.locator('.gallery-nav button').nth(5).click();
  await expect(page.locator('.curator h1')).toContainText('Night');
  await expect(page.locator('#room-index')).toHaveText('06');
  await expect(page.locator('.curator-footer span').first()).toHaveText('4 works');
});

test('visible storage holds the reorganized paintings on lower level B1', async ({ page }) => {
  await page.goto('/');
  await page.locator('.gallery-nav button').nth(6).click();
  await expect(page.locator('.curator h1')).toContainText('Visible');
  await expect(page.locator('#room-index')).toHaveText('B1');
  await expect(page.locator('.curator-footer span').first()).toHaveText('11 / 42 bays occupied');
  await expect(page.locator('.gallery-nav button').nth(6)).toHaveClass(/active/);
});

test('collection view gives visible storage its own category and opens stored works', async ({ page }) => {
  await page.goto('/');
  await page.locator('#collection-toggle').click();
  await expect(page.locator('#collection')).toHaveClass(/open/);
  await expect(page.locator('#collection-grid .collection-card')).toHaveCount(42);
  await expect(page.locator('#collection-total')).toHaveText('42');
  await expect(page.locator('#collection-filters button')).toHaveCount(8);

  await page.locator('#collection-filters [data-filter="5"]').click();
  await expect(page.locator('#collection-grid .collection-card')).toHaveCount(4);
  await expect(page.locator('#collection-grid')).not.toContainText('Moonflower, 11:52 p.m.');

  await page.locator('#collection-filters [data-filter="6"]').click();
  await expect(page.locator('#collection-grid .collection-card')).toHaveCount(11);
  await expect(page.locator('#collection-total')).toHaveText('11');
  await expect(page.locator('#collection-grid h2').first()).toHaveText('Marchioness in Winter Dress');
  await expect(page.locator('#collection-grid')).toContainText('Moonflower, 11:52 p.m.');

  const moonflower = page.locator('.collection-card').filter({ has: page.getByRole('heading', { name: 'Moonflower, 11:52 p.m.', exact: true }) });
  const visitButton = moonflower.locator('[data-visit-room]');
  await expect(visitButton).toHaveAttribute('data-visit-work', '0');
  await visitButton.click();
  await expect(page.locator('#collection')).not.toHaveClass(/open/);
  await expect(page.locator('#room-index')).toHaveText('B1');
  await expect(page.locator('#curator')).toHaveClass(/hidden/);
  await expect(page.locator('#art-card')).toHaveClass(/visible/);
  await expect(page.locator('#art-card h2')).toHaveText('Moonflower, 11:52 p.m.');

  await page.evaluate(() => (
    window as unknown as { museumTurnAround: () => void }
  ).museumTurnAround());
  await expect(page.locator('#art-card')).not.toHaveClass(/visible/);
});

test('shows Roadside Assistance in its gallery and The Puncture only in storage', async ({ page }) => {
  await page.goto('/');
  await page.locator('#collection-toggle').click();
  await page.locator('#collection-filters [data-filter="4"]').click();

  const roadside = page.locator('.collection-card').filter({ has: page.getByRole('heading', { name: 'Roadside Assistance', exact: true }) });
  await expect(roadside).toContainText('The Working Day');
  await expect(roadside.locator('img')).toHaveAttribute('src', '/art/gods-6.webp');
  await expect(page.locator('#collection-grid')).not.toContainText('The Puncture, 2:13 a.m.');

  await page.locator('#collection-filters [data-filter="6"]').click();
  const puncture = page.locator('.collection-card').filter({ has: page.getByRole('heading', { name: 'The Puncture, 2:13 a.m.', exact: true }) });
  await expect(puncture).toContainText('Visible Storage');
  await expect(puncture.locator('img')).toHaveAttribute('src', '/art/gods-3.webp');
  await expect(page.locator('#collection-grid')).not.toContainText('Roadside Assistance');
});

test('room signs open an easy-to-read guide when viewed', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => (
    window as unknown as { museumViewGuide: (room: number) => void }
  ).museumViewGuide(2));
  await expect(page.locator('#gallery-guide')).toHaveClass(/visible/);
  await expect(page.locator('#gallery-guide-title')).toHaveText('Views from the Outer Counties');
  await expect(page.locator('#gallery-guide-copy')).toContainText('regional survey');
});

test('enter control dismisses the curator note', async ({ page }) => {
  await page.goto('/');
  await page.locator('#enter-gallery').click();
  await expect(page.locator('#curator')).toHaveClass(/hidden/);
  await expect(page.locator('#sound')).toHaveAttribute('aria-label', 'Toggle ambience');
});
