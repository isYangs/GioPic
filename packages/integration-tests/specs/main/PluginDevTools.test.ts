import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const execSyncMock = vi.hoisted(() => vi.fn())

// Mock logger
vi.mock('@/main/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    scope: vi.fn((_name: string) => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
}))

// Mock node:fs module
vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    rmSync: vi.fn(),
  },
}))

// Mock node:child_process module
vi.mock('node:child_process', () => ({
  default: {
    execSync: execSyncMock,
  },
  execSync: execSyncMock,
}))

// Mock electron.app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/mock/user/data'),
  },
}))

const { PluginDevTools } = await import('@/main/services/PluginDevTools')

describe('pluginDevTools', () => {
  let pluginDevTools: typeof PluginDevTools
  const mockOutputDir = '/mock/output/dir'
  const mockPluginId = 'test-plugin'
  const mockPluginName = 'Test Plugin'
  const mockTemplateOptions = {
    name: mockPluginName,
    id: mockPluginId,
    author: 'Test Author',
    description: 'A test plugin',
    type: 'image-uploader',
    outputDir: mockOutputDir,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup fs mocks
    vi.mocked(fs.existsSync).mockReturnValue(false) // By default, assume no dir exists
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined)
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({})) // Default empty package.json content for validation
    vi.mocked(fs.rmSync).mockReturnValue(undefined)

    // Setup execSync mock
    vi.mocked(execSync).mockReturnValue('mocked output')

    pluginDevTools = new PluginDevTools()
  })

  // Test constructor
  it('构造函数应该初始化templatesDir并创建目录', () => {
    expect(app.getPath).toHaveBeenCalledWith('userData')
    expect(fs.mkdirSync).toHaveBeenCalledWith(path.join('/mock/user/data', 'plugin-templates'), { recursive: true })
  })

  describe('generatePluginTemplate', () => {
    it('应该生成插件模板文件', async () => {
      const expectedPluginDir = path.join(mockOutputDir, mockPluginId)

      await pluginDevTools.generatePluginTemplate(mockTemplateOptions)

      expect(fs.mkdirSync).toHaveBeenCalledWith(expectedPluginDir, { recursive: true })
      expect(fs.mkdirSync).toHaveBeenCalledWith(path.join(expectedPluginDir, 'src'), { recursive: true })
      expect(fs.writeFileSync).toHaveBeenCalledTimes(6) // package.json, tsconfig.json, tsup.config.ts, index.ts, README.md, .gitignore

      // Verify package.json content
      const packageJsonContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string
      const packageJson = JSON.parse(packageJsonContent)
      expect(packageJson.name).toBe(`giopic-plugin-${mockPluginId}`)
      expect(packageJson.plugin.id).toBe(mockPluginId)
      expect(packageJson.plugin.name).toBe(mockPluginName)

      // Verify index.ts content
      const indexTsContent = vi.mocked(fs.writeFileSync).mock.calls[3][1] as string
      expect(indexTsContent).toContain('export const settingSchema')
      expect(indexTsContent).toContain('export function createUploader')
      expect(indexTsContent).toContain('throw new Error(\'请实现上传逻辑\')')

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        path.join(expectedPluginDir, 'README.md'),
        expect.stringContaining(`# ${mockPluginName}`),
      )
    })

    it('如果目标目录已存在应该抛出错误', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // pluginDir exists
      await expect(pluginDevTools.generatePluginTemplate(mockTemplateOptions)).rejects.toThrow(
        `目录已存在: ${path.join(mockOutputDir, mockPluginId)}`,
      )
    })

    it('应该处理生成模板时的错误', async () => {
      vi.mocked(fs.mkdirSync).mockImplementationOnce(() => {
        throw new Error('mkdir failed')
      })
      await expect(pluginDevTools.generatePluginTemplate(mockTemplateOptions)).rejects.toThrow(
        '生成插件模板失败: mkdir failed',
      )
    })
  })

  describe('buildPlugin', () => {
    const mockPluginDir = path.join(mockOutputDir, mockPluginId)

    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true) // Assume plugin dir and package.json exist
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ name: mockPluginId }))
    })

    it('应该成功构建插件', async () => {
      await pluginDevTools.buildPlugin(mockPluginDir)

      expect(fs.existsSync).toHaveBeenCalledWith(mockPluginDir)
      expect(execSync).toHaveBeenCalledWith('pnpm install', expect.any(Object))
      expect(execSync).toHaveBeenCalledWith('pnpm build', expect.any(Object))
    })

    it('如果插件目录不存在应该抛出错误', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // pluginDir does not exist
      await expect(pluginDevTools.buildPlugin(mockPluginDir)).rejects.toThrow(
        `插件目录不存在: ${mockPluginDir}`,
      )
    })

    it('如果package.json不存在应该抛出错误', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // pluginDir exists
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // package.json does not exist
      await expect(pluginDevTools.buildPlugin(mockPluginDir)).rejects.toThrow('找不到 package.json')
    })

    it('应该处理构建时的错误', async () => {
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error('build command failed')
      })
      await expect(pluginDevTools.buildPlugin(mockPluginDir)).rejects.toThrow(
        '插件构建失败: build command failed',
      )
    })
  })

  describe('packPlugin', () => {
    const mockPluginDir = path.join(mockOutputDir, mockPluginId)
    const mockTgzFileName = `giopic-plugin-${mockPluginId}-1.0.0.tgz`

    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true) // Assume plugin dir exists
      vi.mocked(execSync).mockReturnValue(mockTgzFileName) // pnpm pack returns tgz file name
      // Mock buildPlugin to resolve successfully
      vi.spyOn(pluginDevTools, 'buildPlugin').mockResolvedValue(undefined as any)
    })

    it('应该成功打包插件', async () => {
      const result = await pluginDevTools.packPlugin(mockPluginDir)

      expect(pluginDevTools.buildPlugin).toHaveBeenCalledWith(mockPluginDir)
      expect(execSync).toHaveBeenCalledWith('pnpm pack', expect.any(Object))
      expect(fs.existsSync).toHaveBeenCalledWith(expect.stringMatching(/\/.*\.tgz$/))
      expect(result).toMatch(/\/.*\.tgz$/)
    })

    it('如果插件目录不存在应该抛出错误', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // pluginDir does not exist
      await expect(pluginDevTools.packPlugin(mockPluginDir)).rejects.toThrow(
        `插件目录不存在: ${mockPluginDir}`,
      )
    })

    it('如果没有找到tgz文件应该抛出错误', async () => {
      vi.mocked(execSync).mockReturnValue('no tgz file name')
      await expect(pluginDevTools.packPlugin(mockPluginDir)).rejects.toThrow(
        '打包失败：未找到生成的 .tgz 文件',
      )
    })

    it('如果tgz文件不存在应该抛出错误', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // pluginDir exists
      vi.mocked(execSync).mockReturnValue(mockTgzFileName)
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // tgz file does not exist
      await expect(pluginDevTools.packPlugin(mockPluginDir)).rejects.toThrow(
        '插件打包失败: 打包文件不存在:',
      )
    })

    it('应该处理打包时的错误', async () => {
      vi.mocked(execSync).mockImplementationOnce(() => {
        throw new Error('pack command failed')
      })
      await expect(pluginDevTools.packPlugin(mockPluginDir)).rejects.toThrow(
        '插件打包失败: pack command failed',
      )
    })
  })

  describe('validatePlugin', () => {
    const mockPluginDir = path.join(mockOutputDir, mockPluginId)
    const validPackageJson = {
      plugin: { id: mockPluginId, name: mockPluginName, version: '1.0.0', type: 'image' },
    }

    beforeEach(() => {
      vi.mocked(fs.existsSync).mockReturnValue(true) // Assume dir, package.json, src, index.ts exist
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validPackageJson))
    })

    it('应该成功验证有效插件', async () => {
      const result = await pluginDevTools.validatePlugin(mockPluginDir)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('如果插件目录不存在应该返回无效', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // pluginDir does not exist
      const result = await pluginDevTools.validatePlugin(mockPluginDir)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('插件目录不存在')
    })

    it('如果缺少package.json文件应该返回无效', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // pluginDir exists
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // package.json does not exist
      const result = await pluginDevTools.validatePlugin(mockPluginDir)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('缺少 package.json 文件')
    })

    it('如果package.json中缺少plugin字段应该返回无效', async () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({}))
      const result = await pluginDevTools.validatePlugin(mockPluginDir)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('package.json 中缺少 plugin 字段')
    })

    it('如果plugin字段缺少id应该返回无效', async () => {
      const invalidPackageJson = {
        plugin: { name: mockPluginName, version: '1.0.0', type: 'image' },
      }
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(invalidPackageJson))
      const result = await pluginDevTools.validatePlugin(mockPluginDir)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('plugin.id 字段缺失')
    })

    it('如果缺少src目录应该返回无效', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // pluginDir exists
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // package.json exists
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // src dir does not exist
      const result = await pluginDevTools.validatePlugin(mockPluginDir)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('缺少 src 目录')
    })

    it('如果缺少src/index.ts文件应该返回无效', async () => {
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // pluginDir exists
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // package.json exists
      vi.mocked(fs.existsSync).mockReturnValueOnce(true) // src dir exists
      vi.mocked(fs.existsSync).mockReturnValueOnce(false) // src/index.ts does not exist
      const result = await pluginDevTools.validatePlugin(mockPluginDir)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('缺少 src/index.ts 文件')
    })

    it('应该处理验证时的错误', async () => {
      vi.mocked(fs.readFileSync).mockImplementationOnce(() => {
        throw new Error('read file failed')
      })
      const result = await pluginDevTools.validatePlugin(mockPluginDir)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('验证失败: read file failed')
    })
  })
})
