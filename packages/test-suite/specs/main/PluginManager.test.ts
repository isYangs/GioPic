import type { PluginManager as PluginManagerType } from '@/main/services/PluginManager'
import fs from 'node:fs'
import { app } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getStore } from '@/main/stores'

vi.mock('@/main/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    scope: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}))

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    rmSync: vi.fn(),
    copyFileSync: vi.fn(),
    readlinkSync: vi.fn(),
  },
}))

vi.mock('node:child_process', () => ({
  default: {
    execSync: vi.fn(),
  },
  execSync: vi.fn(),
}))

vi.mock('@/main/stores', () => ({
  getStore: vi.fn(),
  setStore: vi.fn(),
}))

describe('pluginManager', () => {
  let PluginManager: typeof PluginManagerType
  let pluginManager: PluginManagerType

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.mocked(app.getPath).mockReturnValue('/mock/user/data')
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readdirSync).mockReturnValue([])
    vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}))
    vi.mocked(getStore).mockImplementation((key: string) => {
      if (key === 'npmRegistry')
        return 'auto'
      if (key === 'customNpmRegistry')
        return ''
      return undefined
    })

    const module = await import('@/main/services/PluginManager')
    PluginManager = module.PluginManager
    pluginManager = new PluginManager()
  })

  it('should initialize plugins directory when missing', async () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(false)
    const manager = new PluginManager()

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringMatching(/\/plugins$/), { recursive: true })
    expect(manager.getAllPlugins().some(p => p.id === 'giopic-lsky')).toBe(true)
    expect(manager.getAllPlugins().some(p => p.id === 'giopic-s3')).toBe(true)
  })

  it('should return built-in plugins', () => {
    const plugins = pluginManager.getAllPlugins()
    expect(plugins.length).toBeGreaterThanOrEqual(2)
    expect(plugins.find(p => p.id === 'giopic-lsky')).toBeDefined()
    expect(plugins.find(p => p.id === 'giopic-s3')).toBeDefined()
  })

  it('should return plugin by id', () => {
    expect(pluginManager.getPlugin('giopic-lsky')?.name).toBe('兰空图床')
    expect(pluginManager.getPlugin('not-exist')).toBeUndefined()
  })

  it('should update npm registry config from store', () => {
    vi.mocked(getStore).mockImplementation((key: string) => {
      if (key === 'npmRegistry')
        return 'custom'
      if (key === 'customNpmRegistry')
        return 'https://custom.registry'
      return undefined
    })

    pluginManager.updateNpmRegistryConfig()

    expect((pluginManager as any).npmRegistries).toEqual([
      {
        name: '自定义源',
        searchUrl: 'https://custom.registry/-/v1/search',
        packageUrl: 'https://custom.registry',
      },
    ])
  })

  it('should compare versions correctly', () => {
    const compareVersions = (pluginManager as any).compareVersions.bind(pluginManager)

    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1)
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1)
  })
})
