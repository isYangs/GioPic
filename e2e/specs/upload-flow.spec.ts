import { expect, test } from '../support/fixtures'
import { createProgramSeed, dropSampleImage, seedDesktopState, setUploadMock } from '../support/helpers'

test('processes a dropped image, uploads it, and persists the record', async ({ page }) => {
  const seededProgram = createProgramSeed()

  await seedDesktopState(page, {
    appStore: {
      appCloseTip: false,
      appCloseType: 'hide',
      defaultProgram: seededProgram.id,
    },
    programStore: {
      programs: [seededProgram],
    },
  })
  await setUploadMock(page, { enabled: true })

  await page.reload()
  await expect(page.getByTestId('home-page')).toBeVisible()

  await dropSampleImage(page, page.getByTestId('upload-area'))

  const uploadCard = page.getByTestId('upload-card-0')
  await expect(uploadCard).toContainText('e2e-image.png')
  await expect(uploadCard).toContainText('待上传')

  await page.getByTestId('upload-batch-button').click()
  await expect(uploadCard).toContainText('已完成')
  await expect(page.getByTestId('copy-all-links-button')).toBeEnabled()

  await expect.poll(async () => {
    return page.evaluate(async () => {
      const data = await window.ipcRenderer.invoke('fetch-all-upload-data')
      return data.length
    })
  }).toBe(1)

  await page.getByTestId('nav-images').click()
  await expect(page.getByTestId('images-page')).toBeVisible()
  await expect(page.getByText('e2e-image.png')).toBeVisible()
})

test('shows seeded upload history and filters records by keyword', async ({ page }) => {
  const seededProgram = createProgramSeed({ id: 2_026_040_201, name: 'History S3' })

  await seedDesktopState(page, {
    programStore: {
      programs: [seededProgram],
    },
    uploadRecords: [
      {
        key: 'upload-history-cat',
        name: 'cat.png',
        origin_name: 'cat.png',
        mimetype: 'image/png',
        size: 512,
        time: '2026-04-02T00:00:00.000Z',
        program_id: seededProgram.id,
        program_type: seededProgram.type,
        url: 'https://e2e.giopic.local/uploads/cat.png',
      },
      {
        key: 'upload-history-dog',
        name: 'dog.png',
        origin_name: 'dog.png',
        mimetype: 'image/png',
        size: 1024,
        time: '2026-04-02T00:00:00.000Z',
        program_id: seededProgram.id,
        program_type: seededProgram.type,
        url: 'https://e2e.giopic.local/uploads/dog.png',
      },
    ],
  })

  await page.reload()
  await page.getByTestId('nav-images').click()

  await expect(page.getByText('cat.png')).toBeVisible()
  await expect(page.getByText('dog.png')).toBeVisible()

  await page.getByTestId('images-search-input').locator('input').fill('dog')
  await expect(page.getByText('dog.png')).toBeVisible()
  await expect(page.getByText('cat.png')).toHaveCount(0)
})
