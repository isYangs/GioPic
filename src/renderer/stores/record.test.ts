import type { UploadData } from '~/stores/record'
import { createPinia, setActivePinia } from 'pinia'

import { vi } from 'vitest'
import { useUploadDataStore } from '~/stores/record'

describe('useUploadDataStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(window.ipcRenderer.invoke).mockResolvedValue(undefined)
  })

  it('setData with no index pushes to array', () => {
    const store = useUploadDataStore()
    const data: UploadData = { key: 'img-1', name: 'test.jpg' }

    store.setData(data)

    expect(store.data).toHaveLength(1)
    expect(store.data[0].key).toBe('img-1')
  })

  it('setData with index updates existing item', () => {
    const store = useUploadDataStore()
    const data1: UploadData = { key: 'img-1', name: 'test1.jpg' }
    const data2: UploadData = { name: 'test2.jpg' }

    store.setData(data1)
    store.setData(data2, 0)

    expect(store.data).toHaveLength(1)
    expect(store.data[0].key).toBe('img-1')
    expect(store.data[0].name).toBe('test2.jpg')
  })

  it('setData with empty object does nothing', () => {
    const store = useUploadDataStore()
    const data: UploadData = { key: 'img-1' }

    store.setData(data)
    const initialLength = store.data.length

    store.setData({})

    expect(store.data).toHaveLength(initialLength)
  })

  it('setData merges with existing data at index', () => {
    const store = useUploadDataStore()
    const data1: UploadData = { key: 'img-1', name: 'test.jpg', url: 'https://example.com/img.jpg' }
    const data2: UploadData = { name: 'updated.jpg' }

    store.setData(data1)
    store.setData(data2, 0)

    expect(store.data[0]).toMatchObject({
      key: 'img-1',
      name: 'updated.jpg',
      url: 'https://example.com/img.jpg',
    })
  })

  it('delData with index removes specific item', () => {
    const store = useUploadDataStore()
    const data1: UploadData = { key: 'img-1' }
    const data2: UploadData = { key: 'img-2' }
    const data3: UploadData = { key: 'img-3' }

    store.setData(data1)
    store.setData(data2)
    store.setData(data3)

    store.delData(1)

    expect(store.data).toHaveLength(2)
    expect(store.data[0].key).toBe('img-1')
    expect(store.data[1].key).toBe('img-3')
  })

  it('delData without index clears all data', () => {
    const store = useUploadDataStore()

    store.setData({ key: 'img-1' })
    store.setData({ key: 'img-2' })
    store.setData({ key: 'img-3' })

    store.delData()

    expect(store.data).toHaveLength(0)
  })

  it('getUploadData sends data to main process', async () => {
    const store = useUploadDataStore()
    const data: UploadData = {
      key: 'img-1',
      name: 'test.jpg',
      time: '2024-01-01T00:00:00Z',
      size: 1024,
      mimetype: 'image/jpeg',
      url: 'https://example.com/img.jpg',
      origin_name: 'original.jpg',
      program_id: 1,
      program_type: 'cloudinary',
    }

    store.setData(data)
    await store.getUploadData()

    expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
      'insert-upload-data',
      expect.stringContaining('img-1'),
    )
  })

  it('getUploadData filters out items without url and key', async () => {
    const store = useUploadDataStore()

    store.setData({ key: 'img-1', url: 'https://example.com/img.jpg' })
    store.setData({ key: 'img-2' })
    store.setData({ url: 'https://example.com/img2.jpg' })

    await store.getUploadData()

    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(1)
  })

  it('getUploadData calls ipcRenderer for each valid item', async () => {
    const store = useUploadDataStore()

    store.setData({ key: 'img-1', url: 'https://example.com/img.jpg' })
    store.setData({ key: 'img-2', url: 'https://example.com/img2.jpg' })

    await store.getUploadData()

    expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(2)
  })

  it('getUploadData includes all required fields', async () => {
    const store = useUploadDataStore()
    const data: UploadData = {
      key: 'img-1',
      name: 'test.jpg',
      time: '2024-01-01',
      size: 2048,
      mimetype: 'image/jpeg',
      url: 'https://example.com/img.jpg',
      origin_name: 'original.jpg',
      program_id: 42,
      program_type: 's3',
    }

    store.setData(data)
    await store.getUploadData()

    const callArg = vi.mocked(window.ipcRenderer.invoke).mock.calls[0][1]
    const parsedData = JSON.parse(callArg as string)

    expect(parsedData).toMatchObject({
      key: 'img-1',
      name: 'test.jpg',
      time: '2024-01-01',
      size: 2048,
      mimetype: 'image/jpeg',
      url: 'https://example.com/img.jpg',
      origin_name: 'original.jpg',
      program_id: 42,
      program_type: 's3',
    })
  })
})
