import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'

import { useProgramStore } from '~/stores/program'

vi.mock('~/stores/plugin', () => ({
  usePluginStore: vi.fn(() => ({
    getPluginNameByType: vi.fn((type: string) => `Plugin ${type}`),
  })),
}))

vi.mock('~/stores/plugin-data', () => ({
  usePluginDataStore: vi.fn(() => ({
    removeProgramData: vi.fn(),
  })),
}))

describe('useProgramStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('createProgram adds program with correct type and generated id', () => {
    const store = useProgramStore()

    const id = store.createProgram('cloudinary')

    expect(store.programs).toHaveLength(1)
    expect(store.programs[0].type).toBe('cloudinary')
    expect(store.programs[0].id).toBe(id)
    expect(typeof id).toBe('number')
  })

  it('createProgram initializes program with default values', () => {
    const store = useProgramStore()

    store.createProgram('imgur')

    const program = store.programs[0]
    expect(program.name).toBe('')
    expect(program.detail).toEqual({})
    expect(program.pluginId).toBe('')
  })

  it('setProgramDetail merges detail into existing program', () => {
    const store = useProgramStore()
    const id = store.createProgram('s3')

    store.setProgramDetail(id, { bucket: 'my-bucket', region: 'us-east-1' })

    const program = store.getProgram(id)
    expect(program.detail.bucket).toBe('my-bucket')
    expect(program.detail.region).toBe('us-east-1')
  })

  it('setProgramDetail merges with existing detail', () => {
    const store = useProgramStore()
    const id = store.createProgram('s3')

    store.setProgramDetail(id, { bucket: 'my-bucket' })
    store.setProgramDetail(id, { region: 'us-east-1' })

    const program = store.getProgram(id)
    expect(program.detail.bucket).toBe('my-bucket')
    expect(program.detail.region).toBe('us-east-1')
  })

  it('setProgramName sets name', () => {
    const store = useProgramStore()
    const id = store.createProgram('cloudinary')

    store.setProgramName(id, 'My Cloudinary Account')

    expect(store.getProgram(id).name).toBe('My Cloudinary Account')
  })

  it('getProgram returns program by id', () => {
    const store = useProgramStore()
    const id = store.createProgram('imgur')

    const program = store.getProgram(id)

    expect(program.type).toBe('imgur')
    expect(program.id).toBe(id)
  })

  it('getProgram returns default for non-existent id', () => {
    const store = useProgramStore()

    const program = store.getProgram(9999)

    expect(program.type).toBe('unknown')
    expect(program.id).toBeNull()
    expect(program.name).toBe('')
    expect(program.detail).toEqual({})
  })

  it('getProgramList returns array with program mappings', () => {
    const store = useProgramStore()
    store.createProgram('cloudinary')

    const list = store.getProgramList()

    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
    expect(list[0]).toHaveProperty('label')
    expect(list[0]).toHaveProperty('value')
    expect(list[0]).toHaveProperty('type')
  })

  it('getProgramList uses plugin name when program name is empty', () => {
    const store = useProgramStore()
    store.createProgram('s3')

    const list = store.getProgramList()

    expect(list[0].label).toBe('Plugin s3')
  })

  it('removeProgram removes program and returns adjusted index', () => {
    const store = useProgramStore()
    const id1 = store.createProgram('cloudinary')
    const id2 = store.createProgram('imgur')
    const id3 = store.createProgram('s3')

    const adjustedIndex = store.removeProgram(id2)

    expect(store.programs).toHaveLength(2)
    expect(store.programs.some(p => p.id === id1)).toBe(true)
    expect(store.programs.some(p => p.id === id3)).toBe(true)
    expect(adjustedIndex).toBe(0)
  })

  it('removeProgram returns 0 when removing first program', () => {
    const store = useProgramStore()
    const id1 = store.createProgram('cloudinary')
    store.createProgram('imgur')

    const adjustedIndex = store.removeProgram(id1)

    expect(adjustedIndex).toBe(0)
  })

  it('removeProgram calls removeProgramData', () => {
    const store = useProgramStore()
    const id = store.createProgram('cloudinary')

    store.removeProgram(id)

    expect(store.programs).not.toContainEqual(expect.objectContaining({ id }))
  })

  it('removeProgramsByPluginId removes all programs with matching pluginId', () => {
    const store = useProgramStore()
    store.createProgram('cloudinary')
    store.createProgram('imgur')
    store.createProgram('s3')

    store.programs[0].pluginId = 'plugin-1'
    store.programs[1].pluginId = 'plugin-1'
    store.programs[2].pluginId = 'plugin-2'

    store.removeProgramsByPluginId('plugin-1')

    expect(store.programs).toHaveLength(1)
    expect(store.programs[0].pluginId).toBe('plugin-2')
  })

  it('removeProgramsByPluginId returns array of removed programs', () => {
    const store = useProgramStore()
    const id1 = store.createProgram('cloudinary')
    const id2 = store.createProgram('imgur')

    store.programs[0].pluginId = 'plugin-1'
    store.programs[1].pluginId = 'plugin-1'

    const removed = store.removeProgramsByPluginId('plugin-1')

    expect(removed).toHaveLength(2)
    expect(removed[0].id).toBe(id1)
    expect(removed[1].id).toBe(id2)
  })

  it('getPluginSetting returns existing setting', () => {
    const store = useProgramStore()
    const id = store.createProgram('cloudinary')

    store.setProgramDetail(id, { 'plugin-1': { apiKey: 'secret' } })

    const setting = store.getPluginSetting(id, 'plugin-1')

    expect(setting.apiKey).toBe('secret')
  })

  it('getPluginSetting creates nested object if not exists', () => {
    const store = useProgramStore()
    const id = store.createProgram('cloudinary')

    const setting = store.getPluginSetting(id, 'plugin-1')

    expect(setting).toEqual({})
    expect(store.getProgram(id).detail['plugin-1']).toBe(setting)
  })

  it('getPluginSetting reuses existing nested object', () => {
    const store = useProgramStore()
    const id = store.createProgram('cloudinary')

    const setting1 = store.getPluginSetting(id, 'plugin-1')
    setting1.apiKey = 'secret'

    const setting2 = store.getPluginSetting(id, 'plugin-1')

    expect(setting2.apiKey).toBe('secret')
    expect(setting1).toBe(setting2)
  })
})
