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

test('opens settings and focuses the custom npm registry input', async ({ page }) => {
  await page.getByTestId('titlebar-settings').click()
  await page.getByText('程序设置', { exact: true }).click()

  await expect(page.getByTestId('settings-panel')).toBeVisible()

  await page.getByTestId('settings-tab-system').click()

  const registrySelect = page.getByTestId('settings-npm-registry-select').locator('.n-base-selection')
  await registrySelect.click()

  await page.locator('.n-base-select-option').filter({ hasText: '自定义' }).click()

  const customRegistryInput = page.getByTestId('settings-custom-npm-registry-input').locator('input')
  await expect(customRegistryInput).toBeVisible()
  await expect(customRegistryInput).toBeFocused()
})
