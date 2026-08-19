import { expect, test } from '@playwright/test'

test('shows all stories and the recommended setup', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Something is being left unsaid.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Your Neighbor June/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Interview for Operations Coordinator/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Support Ticket 13-B/ })).toBeVisible()
  await expect(page.getByText('GPT 5.6 Sol')).toBeVisible()
  await expect(page.getByText('Claude Sonnet 5')).toBeVisible()
  await expect(page.getByText('Gemini 3.7 Flash')).toBeVisible()
  await expect(page.getByText('Medium', { exact: true }).first()).toBeVisible()
})

test('switches stories and provides specific play instructions', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: /Interview for Operations Coordinator/ }).click()
  await expect(page.locator('#story').getByRole('heading', { name: 'Interview for Operations Coordinator' })).toBeVisible()
  await expect(page.getByText('Check dates, work history, references')).toBeVisible()
  await expect(page).toHaveURL(/#job-applicant$/)

  await page.getByRole('button', { name: /Support Ticket 13-B/ }).click()
  await expect(page.locator('#story').getByRole('heading', { name: 'Support Ticket 13-B' })).toBeVisible()
  await expect(page.getByText('Troubleshoot methodically: timing, processes')).toBeVisible()
})

test('copies the selected hidden prompt without displaying it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/#absentminded-neighbor')

  await page.getByRole('button', { name: 'Copy hidden prompt' }).click()
  await expect(page.getByRole('button', { name: /Prompt copied/ })).toBeVisible()

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('Begin a chat conversation in character as June Barlow')
  await expect(page.getByText('HARD CONCEALMENT GATE')).toHaveCount(0)
})

test('fits the mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only layout check')
  await page.goto('/')
  await page.getByRole('button', { name: /Interview for Operations Coordinator/ }).click()

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
  await expect(page.locator('#story').getByRole('button', { name: 'Copy hidden prompt' })).toBeVisible()
})
