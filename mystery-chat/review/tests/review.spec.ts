import { expect, test } from '@playwright/test'

test('starts unspoiled and can copy the current prompt unseen', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('Spoilers concealed')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'The Final Candidate', level: 2 })).toBeVisible()
  await expect(page.getByText('THE TRUTH')).toHaveCount(0)
  await expect(page.locator('.message-row')).toHaveCount(0)

  await page.getByRole('button', { name: 'Copy hidden prompt' }).click()
  await expect(page.getByRole('button', { name: /Copied unseen/ })).toBeVisible()
  await expect(page.getByText('THE TRUTH')).toHaveCount(0)
  await expect(page).toHaveURL(/view=briefing/)

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('Mara Voss')
  expect(clipboard).toContain('THE TRUTH')
})

test('reveals prompts and runs only after explicit navigation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Reveal story prompt/ }).click()
  await expect(page.getByRole('heading', { name: 'THE TRUTH' })).toBeVisible()
  await expect(page).toHaveURL(/view=prompt/)

  await page.getByRole('button', { name: /Inspect playtests/ }).click()
  await expect(page.getByRole('article').getByText('Playtest evidence', { exact: true })).toBeVisible()
  await expect(page.locator('.message-row')).toHaveCount(15)
  await expect(page.getByText('Hidden mystery')).toBeVisible()
  await expect(page).toHaveURL(/view=runs&run=natural/)

  await page.getByRole('tab', { name: /Investigative/ }).click()
  await expect(page).toHaveURL(/run=investigative/)
  await expect(page.locator('.message-row')).toHaveCount(17)
})

test('switching stories restores the player-only view', async ({ page }) => {
  await page.goto('/#story=job-applicant&view=prompt&prompt=v2')
  await expect(page.getByRole('heading', { name: 'THE TRUTH' })).toBeVisible()

  await page.getByRole('button', { name: /What June Saw Offshore/ }).click()
  await expect(page.getByText('Spoilers concealed')).toBeVisible()
  await expect(page.getByText(/Last night.?s storm/)).toBeVisible()
  await expect(page.getByText('WHAT ACTUALLY HAPPENED')).toHaveCount(0)
  await expect(page).toHaveURL(/story=absentminded-neighbor&view=briefing/)
})

test('mobile player view has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByText('Spoilers concealed')).toBeVisible()
  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }))
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
  await page.screenshot({ path: 'screenshots/player-view-mobile.png', fullPage: true })
})
