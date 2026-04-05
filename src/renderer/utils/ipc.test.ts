import { beforeEach, describe, expect, it, vi } from 'vitest'
import { callIpc } from '~/utils/ipc'

describe('callIpc', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'ipcRenderer', {
      configurable: true,
      writable: true,
      value: {
        callMain: vi.fn(),
      },
    })
  })

  it('should call ipcRenderer.callMain with channel and data', async () => {
    vi.mocked(window.ipcRenderer.callMain).mockResolvedValue('result')

    const result = await callIpc('test-channel', { key: 'value' })

    expect(window.ipcRenderer.callMain).toHaveBeenCalledWith('test-channel', { key: 'value' })
    expect(result).toBe('result')
  })

  it('should call without data when not provided', async () => {
    vi.mocked(window.ipcRenderer.callMain).mockResolvedValue(null)

    await callIpc('empty-channel')

    expect(window.ipcRenderer.callMain).toHaveBeenCalledWith('empty-channel', undefined)
  })

  it('should re-throw Error instances', async () => {
    const error = new Error('ipc failed')
    vi.mocked(window.ipcRenderer.callMain).mockRejectedValue(error)

    await expect(callIpc('fail-channel')).rejects.toThrow('ipc failed')
  })

  it('should wrap non-Error rejections in Error', async () => {
    vi.mocked(window.ipcRenderer.callMain).mockRejectedValue('string error')

    await expect(callIpc('fail-channel')).rejects.toThrow('IPC调用失败: fail-channel')
  })
})
