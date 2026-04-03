import { expect, test } from '../support/fixtures'
import { getMainWindowState, restoreMainWindow } from '../support/helpers'

test('launches the desktop shell and navigates core pages', async ({ page }) => {
  await expect(page.getByTestId('home-page')).toBeVisible()
  await expect(page.getByTestId('sidebar')).toBeVisible()

  await page.getByTestId('nav-images').click()
  await expect(page.getByTestId('images-page')).toBeVisible()
  await expect(page.getByTestId('images-empty-state')).toBeVisible()

  await page.getByTestId('nav-plugins').click()
  await expect(page.getByTestId('plugins-page')).toBeVisible()

  await page.getByTestId('nav-home').click()
  await expect(page.getByTestId('home-page')).toBeVisible()
})

test('supports title bar window actions', async ({ electronApp, page }) => {
  await page.getByTestId('window-maximize').click()
  await expect.poll(async () => (await getMainWindowState(electronApp))?.isMaximized).toBe(true)

  await page.getByTestId('window-maximize').click()
  await expect.poll(async () => (await getMainWindowState(electronApp))?.isMaximized).toBe(false)

  await page.getByTestId('window-minimize').click()
  await expect.poll(async () => (await getMainWindowState(electronApp))?.isMinimized).toBe(true)

  await restoreMainWindow(electronApp)
  await expect.poll(async () => (await getMainWindowState(electronApp))?.isMinimized).toBe(false)

  await page.getByTestId('window-close').click()
  await expect.poll(async () => (await getMainWindowState(electronApp))?.isVisible).toBe(false)

  await restoreMainWindow(electronApp)
  await expect.poll(async () => (await getMainWindowState(electronApp))?.isVisible).toBe(true)
})
