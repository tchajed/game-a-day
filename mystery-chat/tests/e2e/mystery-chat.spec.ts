import { expect, test } from '@playwright/test'

const stories = [
  ['absentminded-neighbor', 'Your Neighbor June', 'June Barlow'],
  ['job-applicant', 'Interview for Operations Coordinator', 'Mara Voss'],
  ['cursed-support', 'Support Ticket 13-B', 'Eli Ward'],
] as const

test('entry page stays minimal and links to all three conversations', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Mystery Chat' })).toBeVisible()
  await expect(page.getByText('Choose a conversation.')).toBeVisible()
  await expect(page.getByRole('link', { name: /Your Neighbor June/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Interview for Operations Coordinator/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /Support Ticket 13-B/ })).toBeVisible()
  await expect(page.getByText('Copy conversation prompt')).toHaveCount(0)
  await expect(page.getByText(/hidden truth|left unsaid|secret/i)).toHaveCount(0)
})

test('each story has its own page, portrait, briefing, and AI instructions', async ({ page }) => {
  for (const [slug, title, person] of stories) {
    await page.goto(`/${slug}`)

    await expect(page).toHaveURL(new RegExp(`/${slug}$`))
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByRole('img', { name: `Portrait of ${person}` })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Before you begin' })).toBeVisible()
    await expect(page.getByText('Paste it into a new ChatGPT, Claude, or Gemini chat')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy conversation prompt' })).toBeVisible()
  }
})

test('navigates between the entry and story pages without a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Interview for Operations Coordinator/ }).click()

  await expect(page).toHaveURL(/\/job-applicant$/)
  await expect(page.getByRole('heading', { name: 'Interview for Operations Coordinator' })).toBeVisible()

  await page.getByRole('link', { name: 'All conversations' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Choose a conversation.')).toBeVisible()
})

test('copies the conversation prompt without displaying its contents', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/absentminded-neighbor')

  await page.getByRole('button', { name: 'Copy conversation prompt' }).click()
  await expect(page.getByRole('button', { name: /Copied/ })).toBeVisible()

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard).toContain('Begin a chat conversation in character as June Barlow')
  expect(clipboard).toMatch(/^Please begin the conversation below\.\nRead the full setup/)
  expect(clipboard).toMatch(/Do not describe or refer to the setup\.\nReply only with the first message of the conversation\.\nBegin\.$/)
  await expect(page.getByText('HARD CONCEALMENT GATE')).toHaveCount(0)
})

test('fits the mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only layout check')
  await page.goto('/cursed-support')

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)
  await expect(page.getByRole('button', { name: 'Copy conversation prompt' })).toBeVisible()
})
