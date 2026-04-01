import type { StoragePlugin } from '@giopic/core'
import { Buffer } from 'node:buffer'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { platform } from '@electron-toolkit/utils'
import { app } from 'electron'
import { getStore } from '../stores'
import logger from '../utils/logger'

const pluginLogger = logger.scope('PluginManager')

interface NpmSearchResult {
  name: string
  version: string
  description: string
  author?: {
    name: string
  }
  date: string
  keywords?: string[]
  homepage?: string
  downloadCount?: number
  recommendScore?: number
}

interface RemoteRecommendedPluginConfigItem {
  name: string
  reason?: string
}

interface RemoteRecommendedPluginConfig {
  updatedAt?: string
  recommendedPlugins?: RemoteRecommendedPluginConfigItem[]
}

export class PluginManager {
  private pluginsDir: string
  private plugins: Map<string, StoragePlugin> = new Map()
  private builtinPluginIds: Set<string> = new Set()
  private pluginVersionCache: Map<string, { version: string, lastCheck: number }> = new Map()
  private recommendedPluginsConfigUrl = 'https://raw.githubusercontent.com/isYangs/GioPic/main/recommended-plugins.json'

  private defaultNpmRegistries = [
    {
      name: '淘宝镜像',
      searchUrl: 'https://registry.npmmirror.com/-/v1/search',
      packageUrl: 'https://registry.npmmirror.com',
    },
    {
      name: '腾讯镜像',
      searchUrl: 'https://mirrors.cloud.tencent.com/npm/-/v1/search',
      packageUrl: 'https://mirrors.cloud.tencent.com/npm',
    },
    {
      name: '官方镜像',
      searchUrl: 'https://registry.npmjs.org/-/v1/search',
      packageUrl: 'https://registry.npmjs.org',
    },
  ]

  private npmRegistries = [...this.defaultNpmRegistries]

  private builtinPlugins: StoragePlugin[] = [
    {
      id: 'giopic-lsky',
      name: '兰空图床',
      version: '1.0.0',
      author: 'isYangs',
      description: '兰空插件，同时支持社区版和企业版v1',
      type: 'lsky',
      isBuiltin: true,
      npmPackage: '@giopic/lsky-plugin',
      enabled: true,
    },
    {
      id: 'giopic-s3',
      name: 'S3存储',
      version: '1.0.0',
      author: 'isYangs',
      description: '兼容S3协议的存储服务(如AWS/腾讯云/阿里云)',
      type: 's3',
      isBuiltin: true,
      npmPackage: '@giopic/s3-plugin',
      enabled: true,
    },
  ]

  constructor() {
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins')

    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true })
    }

    this.builtinPlugins.forEach((plugin) => {
      this.plugins.set(plugin.id, plugin)
      this.builtinPluginIds.add(plugin.id)
    })

    this.updateNpmRegistryConfig()
  }

  /**
   * 更新插件源配置
   */
  updateNpmRegistryConfig() {
    try {
      const npmRegistry = getStore('npmRegistry') || 'auto'
      const customNpmRegistry = getStore('customNpmRegistry') || ''

      pluginLogger.info(`更新插件源配置: ${npmRegistry}`)

      if (npmRegistry === 'custom' && customNpmRegistry) {
        this.npmRegistries = [{
          name: '自定义源',
          searchUrl: `${customNpmRegistry.replace(/\/$/, '')}/-/v1/search`,
          packageUrl: customNpmRegistry.replace(/\/$/, ''),
        }]
      }
      else if (npmRegistry === 'taobao') {
        this.npmRegistries = [this.defaultNpmRegistries[0]]
      }
      else if (npmRegistry === 'tencent') {
        this.npmRegistries = [this.defaultNpmRegistries[1]]
      }
      else if (npmRegistry === 'npm') {
        this.npmRegistries = [this.defaultNpmRegistries[2]]
      }
      else {
        this.npmRegistries = [...this.defaultNpmRegistries]
      }

      pluginLogger.info(`当前使用的插件源: ${this.npmRegistries.map(r => r.name).join(', ')}`)
    }
    catch (e) {
      pluginLogger.error('更新插件源配置失败:', e)
      this.npmRegistries = [...this.defaultNpmRegistries]
    }
  }

  /**
   * 搜索插件源上的插件
   * @param query 搜索关键词
   */
  async searchNpmPlugins(query: string): Promise<NpmSearchResult[]> {
    // 智能处理搜索关键词
    let searchQuery: string
    if (!query) {
      searchQuery = 'giopic-plugin'
    }
    else if (query.startsWith('giopic-plugin') || query.startsWith('@giopic/')) {
      // 用户输入了完整包名，直接使用
      searchQuery = query
    }
    else {
      // 用户输入关键词，添加前缀
      searchQuery = `giopic-plugin-${query}`
    }
    pluginLogger.info(`搜索插件源插件: ${searchQuery}`)

    for (const registry of this.npmRegistries) {
      try {
        pluginLogger.info(`尝试使用 ${registry.name} 搜索插件`)

        const searchUrl = `${registry.searchUrl}?text=${encodeURIComponent(searchQuery)}&size=50`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        try {
          const response = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'GioPic/1.0.0',
            },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`${registry.name}搜索请求失败: ${response.status} ${response.statusText}`)
          }

          const data = await response.json()

          if (!data.objects || !Array.isArray(data.objects)) {
            continue
          }

          const results: NpmSearchResult[] = data.objects.map((item: any) => ({
            name: item.package.name,
            version: item.package.version,
            description: item.package.description || '',
            author: item.package.author,
            date: item.package.date,
            keywords: item.package.keywords,
            homepage: item.package.homepage,
          }))

          const filteredResults = results.filter((pkg) => {
            return pkg.name.includes('giopic-plugin')
              && (pkg.keywords?.includes('giopic')
                || pkg.keywords?.includes('image')
                || pkg.description.toLowerCase().includes('giopic'))
          })

          if (filteredResults.length > 0 || registry === this.npmRegistries[this.npmRegistries.length - 1]) {
            pluginLogger.info(`通过 ${registry.name} 搜索成功，找到 ${filteredResults.length} 个插件`)
            return filteredResults
          }
        }
        finally {
          clearTimeout(timeoutId)
        }
      }
      catch (e) {
        pluginLogger.warn(`${registry.name} 搜索失败:`, e instanceof Error ? e.message : String(e))
      }
    }

    if (this.npmRegistries.length === 1) {
      const registryName = this.npmRegistries[0].name
      throw new Error(`${registryName}无法访问，请检查网络连接或更换源`)
    }
    else {
      throw new Error('所有插件源都无法访问，请检查网络连接')
    }
  }

  /**
   * 从插件源安装插件
   * @param packageName 插件包名
   */
  async installNpmPlugin(packageName: string): Promise<StoragePlugin | null> {
    try {
      pluginLogger.info(`开始从插件源安装: ${packageName}`)
      const tempDir = path.join(this.pluginsDir, '.temp', packageName.replace(/[/\\:*?"<>|]/g, '_'))

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      let tgzPath: string | null = null
      let lastError: Error | null = null

      for (const registry of this.npmRegistries) {
        try {
          pluginLogger.info(`尝试使用 ${registry.name} 安装插件: ${packageName}`)

          // 1. 获取包信息
          const packageUrl = `${registry.packageUrl}/${packageName}`
          const metaController = new AbortController()
          const metaTimeoutId = setTimeout(() => metaController.abort(), 10000)

          const metaResponse = await fetch(packageUrl, {
            headers: { 'User-Agent': 'GioPic/1.0.0' },
            signal: metaController.signal,
          })

          clearTimeout(metaTimeoutId)

          if (!metaResponse.ok) {
            throw new Error(`获取包信息失败: ${metaResponse.status}`)
          }

          const packageMeta = await metaResponse.json()
          const latestVersion = packageMeta['dist-tags']?.latest
          if (!latestVersion) {
            throw new Error('无法获取最新版本')
          }

          const versionInfo = packageMeta.versions?.[latestVersion]
          if (!versionInfo?.dist?.tarball) {
            throw new Error('无法获取下载地址')
          }

          // 2. 下载 tarball
          const tarballUrl = versionInfo.dist.tarball
          pluginLogger.info(`下载插件包: ${tarballUrl}`)

          const downloadController = new AbortController()
          const downloadTimeoutId = setTimeout(() => downloadController.abort(), 60000)

          const downloadResponse = await fetch(tarballUrl, {
            headers: { 'User-Agent': 'GioPic/1.0.0' },
            signal: downloadController.signal,
          })

          clearTimeout(downloadTimeoutId)

          if (!downloadResponse.ok) {
            throw new Error(`下载失败: ${downloadResponse.status}`)
          }

          const buffer = Buffer.from(await downloadResponse.arrayBuffer())
          tgzPath = path.join(tempDir, `${packageName.replace(/[/@]/g, '_')}-${latestVersion}.tgz`)
          fs.writeFileSync(tgzPath, buffer)

          pluginLogger.info(`通过 ${registry.name} 下载成功`)
          break
        }
        catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e))
          pluginLogger.warn(`通过 ${registry.name} 安装失败:`, lastError.message)
        }
      }

      if (!tgzPath) {
        if (this.npmRegistries.length === 1) {
          const registryName = this.npmRegistries[0].name
          throw lastError || new Error(`通过${registryName}无法安装插件，请检查网络连接或更换插件源`)
        }
        else {
          throw lastError || new Error('所有插件源都无法安装插件')
        }
      }

      // 解压并安装
      const extractDir = path.join(tempDir, 'extracted')
      fs.mkdirSync(extractDir, { recursive: true })

      const packageDir = await this.extractPackage(tgzPath, extractDir)
      const { pluginInfo } = this.validatePluginPackage(packageDir)
      const installedPlugin = await this.installAndLoadPlugin(packageDir, pluginInfo, {
        installSource: 'npm',
        npmPackage: packageName,
      })

      fs.rmSync(tempDir, { recursive: true, force: true })

      pluginLogger.info(`插件 ${installedPlugin.name} (${installedPlugin.id}) 从插件源安装成功`)
      return installedPlugin
    }
    catch (e) {
      pluginLogger.error(`插件安装失败: ${packageName}`, e)
      throw new Error(`插件安装失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  /**
   * 检查插件是否为内置插件
   * @param pluginId 插件ID
   */
  private isRealBuiltinPlugin(pluginId: string): boolean {
    return this.builtinPluginIds.has(pluginId)
  }

  /**
   * 初始化插件系统
   */
  async init() {
    try {
      await this.loadPlugins()
      pluginLogger.info('插件系统初始化完成')
    }
    catch (e) {
      pluginLogger.error('插件系统初始化失败', e)
    }
  }

  /**
   * 加载所有本地插件
   */
  private async loadPlugins() {
    try {
      const pluginDirs = fs.readdirSync(this.pluginsDir)

      for (const dir of pluginDirs) {
        const pluginPath = path.join(this.pluginsDir, dir)
        const stat = fs.statSync(pluginPath)

        if (stat.isDirectory()) {
          await this.loadPlugin(pluginPath)
        }
      }
    }
    catch (e) {
      pluginLogger.error('加载插件失败', e)
    }
  }

  /**
   * 加载单个插件
   * @param pluginPath 插件路径
   */
  private async loadPlugin(pluginPath: string) {
    try {
      const packageJsonPath = path.join(pluginPath, 'package.json')

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

        if (packageJson.plugin) {
          const icon = this.resolvePluginIcon(this.getPluginIconField(packageJson), pluginPath)
          const plugin: StoragePlugin = {
            ...packageJson.plugin,
            icon,
            path: pluginPath,
            isBuiltin: false,
            enabled: packageJson.plugin.enabled !== false,
          }

          if (this.validatePlugin(plugin)) {
            this.plugins.set(plugin.id, plugin)
            pluginLogger.info(`插件 ${plugin.name} (${plugin.id}) 加载成功`)
          }
        }
      }
    }
    catch (e) {
      pluginLogger.error(`加载插件失败: ${pluginPath}`, e)
    }
  }

  /**
   * 验证插件是否有效
   * @param plugin 插件信息
   */
  private validatePlugin(plugin: StoragePlugin): boolean {
    if (!plugin.id || !plugin.name || !plugin.version || !plugin.type) {
      pluginLogger.error(`插件 ${plugin.id || '未知'} 缺少必填字段`)
      return false
    }

    if (this.isRealBuiltinPlugin(plugin.id) && !plugin.isBuiltin) {
      pluginLogger.error(`外部插件不能使用内置插件ID: ${plugin.id}`)
      return false
    }

    if (this.plugins.has(plugin.id) && !this.isRealBuiltinPlugin(plugin.id)) {
      pluginLogger.error(`插件ID已存在: ${plugin.id}`)
      return false
    }

    return true
  }

  private getPluginIconField(packageJson: Record<string, any>): string | undefined {
    const packageIcon = typeof packageJson.icon === 'string' ? packageJson.icon.trim() : ''
    if (packageIcon) {
      return packageIcon
    }

    const pluginIcon = typeof packageJson.plugin?.icon === 'string' ? packageJson.plugin.icon.trim() : ''
    return pluginIcon || undefined
  }

  private isIconifyIcon(icon: string): boolean {
    return /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/i.test(icon)
  }

  private hasUriScheme(icon: string): boolean {
    return /^[a-z][a-z0-9+.-]*:/i.test(icon)
  }

  private resolveRelativePath(baseDir: string, relativePath: string): string | null {
    const resolvedBaseDir = path.resolve(baseDir)
    const resolvedPath = path.resolve(resolvedBaseDir, relativePath)
    if (resolvedPath !== resolvedBaseDir && !resolvedPath.startsWith(`${resolvedBaseDir}${path.sep}`)) {
      return null
    }
    return resolvedPath
  }

  private resolvePluginIcon(iconValue: string | undefined, pluginPath: string): string | undefined {
    if (!iconValue) {
      return undefined
    }

    const icon = iconValue.trim()
    if (!icon) {
      return undefined
    }

    if (this.hasUriScheme(icon) || this.isIconifyIcon(icon)) {
      pluginLogger.warn(`插件图标必须是包内相对路径，当前配置无效: ${icon}`)
      return undefined
    }

    if (path.isAbsolute(icon)) {
      pluginLogger.warn(`插件图标不能使用绝对路径: ${icon}`)
      return undefined
    }

    const resolvedPath = this.resolveRelativePath(pluginPath, icon)
    if (!resolvedPath) {
      pluginLogger.warn(`插件图标路径越界: ${icon}`)
      return undefined
    }

    if (!fs.existsSync(resolvedPath)) {
      pluginLogger.warn(`插件图标不存在: ${icon}`)
      return undefined
    }

    if (!fs.statSync(resolvedPath).isFile()) {
      pluginLogger.warn(`插件图标不是文件: ${icon}`)
      return undefined
    }

    return pathToFileURL(resolvedPath).toString()
  }

  private validatePluginIcon(iconValue: string, packageDir: string): boolean {
    const icon = iconValue.trim()
    if (!icon) {
      return true
    }

    if (this.hasUriScheme(icon) || this.isIconifyIcon(icon) || path.isAbsolute(icon)) {
      return false
    }

    const resolvedPath = this.resolveRelativePath(packageDir, icon)
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return false
    }

    return fs.statSync(resolvedPath).isFile()
  }

  private copyPluginIconAsset(iconValue: string, packageDir: string, finalPluginDir: string) {
    const icon = iconValue.trim()
    if (!icon || this.hasUriScheme(icon) || this.isIconifyIcon(icon) || path.isAbsolute(icon)) {
      return
    }

    const sourcePath = this.resolveRelativePath(packageDir, icon)
    const targetPath = this.resolveRelativePath(finalPluginDir, icon)
    if (!sourcePath || !targetPath) {
      pluginLogger.warn(`插件图标路径越界，跳过复制: ${icon}`)
      return
    }

    if (!fs.existsSync(sourcePath)) {
      pluginLogger.warn(`插件图标不存在，跳过复制: ${icon}`)
      return
    }

    const sourceStat = fs.statSync(sourcePath)
    if (sourceStat.isDirectory()) {
      this.copyDir(sourcePath, targetPath)
      return
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true })
    fs.copyFileSync(sourcePath, targetPath)
  }

  /**
   * 安装插件
   * @param pluginPath 插件包路径（支持.tgz、.tar.gz、.zip 或目录）
   */
  async installPlugin(pluginPath: string): Promise<StoragePlugin | null> {
    try {
      pluginLogger.info(`开始安装插件: ${pluginPath}`)

      if (!fs.existsSync(pluginPath)) {
        throw new Error('插件文件或目录不存在')
      }

      const stat = fs.statSync(pluginPath)
      const tempId = Date.now().toString()
      const tempDir = path.join(this.pluginsDir, '.temp', `install_${tempId}`)

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      let packageDir: string

      try {
        if (stat.isDirectory()) {
          packageDir = pluginPath
        }
        else {
          const extractDir = path.join(tempDir, 'extracted')
          fs.mkdirSync(extractDir, { recursive: true })
          packageDir = await this.extractPackage(pluginPath, extractDir)
        }

        const { pluginInfo } = this.validatePluginPackage(packageDir)
        const installedPlugin = await this.installAndLoadPlugin(packageDir, pluginInfo, {
          installSource: 'local',
        })
        return installedPlugin
      }
      finally {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true })
        }
      }
    }
    catch (e) {
      pluginLogger.error('插件安装失败', e)
      throw new Error(`插件安装失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  /**
   * 卸载插件
   * @param pluginId 插件ID
   */
  async uninstallPlugin(pluginId: string) {
    try {
      const plugin = this.plugins.get(pluginId)

      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      if (this.isRealBuiltinPlugin(pluginId)) {
        throw new Error('内置插件不能被卸载')
      }

      if (plugin.path && fs.existsSync(plugin.path)) {
        fs.rmSync(plugin.path, { recursive: true, force: true })
      }

      this.plugins.delete(pluginId)
      return true
    }
    catch (e) {
      pluginLogger.error('插件卸载失败', e)
      return false
    }
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): StoragePlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取指定插件
   * @param pluginId 插件ID
   */
  getPlugin(pluginId: string): StoragePlugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * 获取插件设置模式
   * @param pluginId 插件ID
   */
  async getPluginSettingSchema(pluginId: string) {
    try {
      const plugin = this.getPlugin(pluginId)

      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      const pluginModule = await this.loadPluginModule(pluginId)

      let settingSchema
      if (pluginModule?.default?.settingSchema) {
        settingSchema = pluginModule.default.settingSchema
      }
      else if (pluginModule?.settingSchema) {
        settingSchema = pluginModule.settingSchema
      }
      else {
        throw new Error(`插件 ${pluginId} 没有提供设置模式`)
      }

      return {
        items: settingSchema.items,
        defaultValues: settingSchema.defaultValues,
      }
    }
    catch (e) {
      pluginLogger.error(`插件设置模式获取失败: ${pluginId}`, e)
      throw e
    }
  }

  /**
   * 调用插件自定义方法
   * @param pluginId 插件ID
   * @param methodName 方法名
   * @param params 参数
   */
  async callPluginCustomMethod(pluginId: string, methodName: string, params: any) {
    try {
      const plugin = this.getPlugin(pluginId)

      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      const pluginModule = await this.loadPluginModule(pluginId)

      let settingSchema
      if (pluginModule?.default?.settingSchema) {
        settingSchema = pluginModule.default.settingSchema
      }
      else if (pluginModule?.settingSchema) {
        settingSchema = pluginModule.settingSchema
      }
      else {
        throw new Error(`插件 ${pluginId} 没有提供设置模式`)
      }

      if (!settingSchema.customMethods || !settingSchema.customMethods[methodName]) {
        throw new Error(`插件 ${pluginId} 没有提供自定义方法: ${methodName}`)
      }

      return await settingSchema.customMethods[methodName](params)
    }
    catch (e) {
      pluginLogger.error(`插件自定义方法调用失败: ${pluginId}.${methodName}`, e)
      throw e
    }
  }

  /**
   * 插件上传
   * @param pluginId 插件ID
   * @param params 上传参数
   */
  async uploadWithPlugin(pluginId: string, params: any) {
    try {
      const plugin = this.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      const pluginModule = await this.loadPluginModule(pluginId)
      if (!pluginModule || !pluginModule.default || !pluginModule.default.createUploader) {
        throw new Error(`插件 ${pluginId} 没有提供上传器`)
      }

      const uploader = pluginModule.default.createUploader(params)
      if (!uploader || !uploader.upload) {
        throw new Error(`插件 ${pluginId} 上传器无效`)
      }

      return await uploader.upload(params)
    }
    catch (e) {
      pluginLogger.error(`插件上传失败: ${pluginId}`, e)
      throw new Error(e instanceof Error ? e.message : String(e))
    }
  }

  /**
   * 加载插件模块
   * @param pluginId 插件ID
   */
  private async loadPluginModule(pluginId: string) {
    try {
      const plugin = this.getPlugin(pluginId)

      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      if (plugin.isBuiltin && plugin.npmPackage) {
        return await import(/* @vite-ignore */ plugin.npmPackage)
      }

      if (!plugin.path) {
        throw new Error(`插件 ${pluginId} 缺少路径信息`)
      }

      const mainPath = path.join(plugin.path, 'dist', 'index.js')

      if (!fs.existsSync(mainPath)) {
        throw new Error(`插件主文件不存在: ${mainPath}`)
      }

      const moduleUrl = platform.isWindows
        ? pathToFileURL(mainPath).href
        : pathToFileURL(mainPath).href

      return await import(/* @vite-ignore */ moduleUrl)
    }
    catch (e) {
      pluginLogger.error(`插件模块加载失败: ${pluginId}`, e)
      throw e
    }
  }

  /**
   * 提取并验证插件包
   * @param packagePath 包文件路径
   * @param extractDir 解压目录
   */
  private async extractPackage(packagePath: string, extractDir: string): Promise<string> {
    const ext = path.extname(packagePath).toLowerCase()

    if (ext === '.tgz' || packagePath.endsWith('.tar.gz')) {
      execSync(`tar -xzf "${packagePath}" -C "${extractDir}"`, {
        encoding: 'utf-8',
        timeout: 30000,
      })
      return path.join(extractDir, 'package')
    }
    else if (ext === '.zip') {
      try {
        execSync(`unzip -q "${packagePath}" -d "${extractDir}"`, {
          encoding: 'utf-8',
          timeout: 30000,
        })
      }
      catch {
        try {
          execSync(`powershell -command "Expand-Archive -Path '${packagePath}' -DestinationPath '${extractDir}'"`, {
            encoding: 'utf-8',
            timeout: 30000,
          })
        }
        catch {
          throw new Error('无法解压 zip 文件，请确保系统支持 unzip 命令或 PowerShell')
        }
      }

      const entries = fs.readdirSync(extractDir, { withFileTypes: true })
      const packageDirEntry = entries.find((entry) => {
        if (entry.isDirectory()) {
          const testPath = path.join(extractDir, entry.name, 'package.json')
          return fs.existsSync(testPath)
        }
        return false
      })

      if (packageDirEntry) {
        return path.join(extractDir, packageDirEntry.name)
      }
      else {
        const rootPackageJson = path.join(extractDir, 'package.json')
        if (fs.existsSync(rootPackageJson)) {
          return extractDir
        }
        else {
          throw new Error('压缩包中找不到有效的插件结构')
        }
      }
    }
    else {
      throw new Error('不支持的文件格式，请使用 .tgz、.tar.gz 或 .zip')
    }
  }

  /**
   * 验证插件包结构和信息
   * @param packageDir 插件包目录
   */
  private validatePluginPackage(packageDir: string): { packageJson: any, pluginInfo: any } {
    const packageJsonPath = path.join(packageDir, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('插件缺少 package.json 文件')
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    if (!packageJson.plugin) {
      throw new Error('不是有效的 GioPic 插件：缺少 plugin 字段')
    }

    const pluginInfo = packageJson.plugin
    if (!pluginInfo.id || !pluginInfo.name || !pluginInfo.version || !pluginInfo.type) {
      throw new Error('插件信息不完整：缺少必要字段 (id, name, version, type)')
    }

    if (this.plugins.has(pluginInfo.id)) {
      throw new Error(`插件已存在: ${pluginInfo.id}`)
    }

    if (this.isRealBuiltinPlugin(pluginInfo.id)) {
      throw new Error(`不能安装与内置插件相同ID的插件: ${pluginInfo.id}`)
    }

    const iconField = this.getPluginIconField(packageJson)
    if (iconField && !this.validatePluginIcon(iconField, packageDir)) {
      throw new Error('插件图标配置无效：请在 package.json 的 icon 字段中填写包内相对路径')
    }

    return { packageJson, pluginInfo }
  }

  /**
   * 安装插件到目标目录并加载
   * @param packageDir 插件包目录
   * @param pluginInfo 插件信息
   * @param options 安装选项（包含安装来源、npm 包名、GitHub 仓库信息）
   * @param options.installSource 安装来源
   * @param options.npmPackage npm 包名（当来源为 npm 时）
   * @param options.githubRepo GitHub 仓库名（当来源为 github 时）
   */
  private async installAndLoadPlugin(
    packageDir: string,
    pluginInfo: any,
    options: {
      installSource: 'local' | 'npm' | 'github'
      npmPackage?: string
      githubRepo?: string
    } = { installSource: 'local' },
  ): Promise<StoragePlugin> {
    const finalPluginDir = path.join(this.pluginsDir, pluginInfo.id)

    if (fs.existsSync(finalPluginDir)) {
      fs.rmSync(finalPluginDir, { recursive: true, force: true })
    }

    await this.installPluginViaNpm(packageDir, pluginInfo.id, options)

    await this.loadPlugin(finalPluginDir)

    const installedPlugin = this.plugins.get(pluginInfo.id)
    if (!installedPlugin) {
      throw new Error('插件加载失败')
    }

    pluginLogger.info(`插件 ${installedPlugin.name} (${installedPlugin.id}) 安装成功`)
    return installedPlugin
  }

  /**
   * 通过npm安装插件
   * @param packageDir 插件包目录
   * @param pluginId 插件ID
   * @param options 安装选项
   * @param options.installSource 安装来源
   * @param options.npmPackage npm 包名（当来源为 npm 时）
   * @param options.githubRepo GitHub 仓库名（当来源为 github 时）
   */
  private async installPluginViaNpm(
    packageDir: string,
    pluginId: string,
    options: {
      installSource: 'local' | 'npm' | 'github'
      npmPackage?: string
      githubRepo?: string
    } = { installSource: 'local' },
  ) {
    try {
      const finalPluginDir = path.join(this.pluginsDir, pluginId)

      if (!fs.existsSync(finalPluginDir)) {
        fs.mkdirSync(finalPluginDir, { recursive: true })
      }

      const originalPackageJsonPath = path.join(packageDir, 'package.json')
      const originalPackageJson = JSON.parse(fs.readFileSync(originalPackageJsonPath, 'utf-8'))

      const srcDistDir = path.join(packageDir, 'dist')
      const destDistDir = path.join(finalPluginDir, 'dist')

      if (fs.existsSync(srcDistDir)) {
        this.copyDir(srcDistDir, destDistDir)
      }

      const iconField = this.getPluginIconField(originalPackageJson)
      if (iconField) {
        this.copyPluginIconAsset(iconField, packageDir, finalPluginDir)
      }

      const pluginPackageJson: Record<string, any> = {
        name: originalPackageJson.name || `giopic-plugin-${pluginId}`,
        version: originalPackageJson.version || '1.0.0',
        main: './dist/index.js',
        type: 'module',
        dependencies: {
          '@giopic/core': '^0.1.0',
        },
        plugin: {
          ...originalPackageJson.plugin,
          installSource: options.installSource,
          ...(options.npmPackage ? { npmPackage: options.npmPackage } : {}),
          ...(options.githubRepo ? { githubRepo: options.githubRepo } : {}),
        },
      }

      const packageIcon = typeof originalPackageJson.icon === 'string' ? originalPackageJson.icon.trim() : ''
      if (packageIcon) {
        pluginPackageJson.icon = packageIcon
      }

      const packageJsonPath = path.join(finalPluginDir, 'package.json')
      fs.writeFileSync(packageJsonPath, JSON.stringify(pluginPackageJson, null, 2))

      await this.installDependencies(finalPluginDir)

      pluginLogger.info(`插件 ${pluginId} 安装成功`)
    }
    catch (e) {
      pluginLogger.error(`插件安装失败: ${pluginId}`, e)
      throw new Error(`插件安装失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  /**
   * 安装插件依赖
   * 注意：@giopic/core 作为 peerDependency，运行时会使用主应用中的模块，无需单独安装
   */
  private async installDependencies(_pluginDir: string) {
    // 插件使用 @giopic/core 作为 peerDependency
    // 运行时会自动解析到主应用中已存在的 @giopic/core 模块
    // 因此不需要在插件目录中单独安装依赖
    pluginLogger.info('插件依赖检查完成，@giopic/core 将在运行时从主应用加载')
  }

  private copyDir(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.name === 'node_modules'
        || entry.name === '.git'
        || entry.name === '.DS_Store'
        || entry.name.startsWith('.')) {
        continue
      }

      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      try {
        if (entry.isDirectory()) {
          this.copyDir(srcPath, destPath)
        }
        else if (entry.isSymbolicLink()) {
          // 处理符号链接
          const linkTarget = fs.readlinkSync(srcPath)
          const resolvedTarget = path.resolve(path.dirname(srcPath), linkTarget)

          if (fs.existsSync(resolvedTarget)) {
            const targetStat = fs.statSync(resolvedTarget)
            if (targetStat.isFile()) {
              fs.copyFileSync(resolvedTarget, destPath)
            }
            else if (targetStat.isDirectory()) {
              this.copyDir(resolvedTarget, destPath)
            }
          }
        }
        else {
          fs.copyFileSync(srcPath, destPath)
        }
      }
      catch (e) {
        pluginLogger.warn(`复制文件失败: ${srcPath} -> ${destPath}`, e instanceof Error ? e.message : String(e))
      }
    }
  }

  /**
   * 检查插件是否应该禁用权限选择
   * @param pluginId 插件ID
   * @param config 插件配置
   */
  async shouldDisablePermissionSelect(pluginId: string, config: Record<string, any>) {
    try {
      const plugin = this.getPlugin(pluginId)

      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      const pluginModule = await this.loadPluginModule(pluginId)

      let settingSchema
      if (pluginModule?.default?.settingSchema) {
        settingSchema = pluginModule.default.settingSchema
      }
      else if (pluginModule?.settingSchema) {
        settingSchema = pluginModule.settingSchema
      }
      else {
        return false
      }

      if (settingSchema?.shouldDisablePermissionSelect) {
        return settingSchema.shouldDisablePermissionSelect(config)
      }

      return false
    }
    catch (e) {
      pluginLogger.error(`插件权限禁用状态检查失败: ${pluginId}`, e)
      return false
    }
  }

  /**
   * 启用插件
   * @param pluginId 插件ID
   */
  async enablePlugin(pluginId: string) {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      plugin.enabled = true
      this.plugins.set(pluginId, plugin)

      if (!this.builtinPluginIds.has(pluginId)) {
        pluginLogger.info(`插件已启用: ${pluginId}`)
      }

      return true
    }
    catch (e) {
      pluginLogger.error(`插件启用失败: ${pluginId}`, e)
      return false
    }
  }

  /**
   * 禁用插件
   * @param pluginId 插件ID
   */
  async disablePlugin(pluginId: string) {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      plugin.enabled = false
      this.plugins.set(pluginId, plugin)

      if (!this.builtinPluginIds.has(pluginId)) {
        pluginLogger.info(`插件已禁用: ${pluginId}`)
      }

      return true
    }
    catch (e) {
      pluginLogger.error(`插件禁用失败: ${pluginId}`, e)
      return false
    }
  }

  /**
   * 检查插件是否有更新
   * @param pluginId 插件ID
   */
  async checkPluginUpdate(pluginId: string): Promise<{ hasUpdate: boolean, latestVersion?: string, currentVersion: string, canUpdate?: boolean }> {
    try {
      const plugin = this.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      if (plugin.isBuiltin) {
        return { hasUpdate: false, currentVersion: plugin.version, canUpdate: false }
      }

      // 本地安装的插件不支持在线更新
      if (plugin.installSource === 'local') {
        return { hasUpdate: false, currentVersion: plugin.version, canUpdate: false }
      }

      // 检查缓存（5分钟内不重复检查）
      const cached = this.pluginVersionCache.get(pluginId)
      if (cached && Date.now() - cached.lastCheck < 5 * 60 * 1000) {
        const hasUpdate = this.compareVersions(cached.version, plugin.version) > 0
        return {
          hasUpdate,
          latestVersion: hasUpdate ? cached.version : undefined,
          currentVersion: plugin.version,
          canUpdate: true,
        }
      }

      // GitHub 安装的插件从 GitHub Release 检查更新
      if (plugin.installSource === 'github' && plugin.githubRepo) {
        return await this.checkGitHubPluginUpdate(plugin)
      }

      // npm 安装的插件从 npm registry 检查更新
      return await this.checkNpmPluginUpdate(plugin)
    }
    catch (e) {
      pluginLogger.error(`检查插件更新失败: ${pluginId}`, e)
      throw e
    }
  }

  /**
   * 检查 npm 插件更新
   */
  private async checkNpmPluginUpdate(plugin: StoragePlugin): Promise<{ hasUpdate: boolean, latestVersion?: string, currentVersion: string, canUpdate: boolean }> {
    const packageJsonPath = path.join(plugin.path!, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      return { hasUpdate: false, currentVersion: plugin.version, canUpdate: false }
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const packageName = plugin.npmPackage || packageJson.plugin?.npmPackage || packageJson.name

    if (!packageName) {
      return { hasUpdate: false, currentVersion: plugin.version, canUpdate: false }
    }

    for (const registry of this.npmRegistries) {
      try {
        const packageUrl = `${registry.packageUrl}/${packageName}`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(packageUrl, {
          headers: { 'User-Agent': 'GioPic/1.0.0' },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const latestVersion = data['dist-tags']?.latest

          if (latestVersion) {
            this.pluginVersionCache.set(plugin.id, {
              version: latestVersion,
              lastCheck: Date.now(),
            })

            const hasUpdate = this.compareVersions(latestVersion, plugin.version) > 0
            return {
              hasUpdate,
              latestVersion: hasUpdate ? latestVersion : undefined,
              currentVersion: plugin.version,
              canUpdate: true,
            }
          }
        }
      }
      catch (e) {
        pluginLogger.warn(`检查更新失败 (${registry.name}):`, e instanceof Error ? e.message : String(e))
      }
    }

    return { hasUpdate: false, currentVersion: plugin.version, canUpdate: true }
  }

  /**
   * 检查 GitHub 插件更新
   */
  private async checkGitHubPluginUpdate(plugin: StoragePlugin): Promise<{ hasUpdate: boolean, latestVersion?: string, currentVersion: string, canUpdate: boolean }> {
    if (!plugin.githubRepo) {
      return { hasUpdate: false, currentVersion: plugin.version, canUpdate: false }
    }

    try {
      const apiUrl = `https://api.github.com/repos/${plugin.githubRepo}/releases/latest`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'GioPic/1.0.0',
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const latestVersion = data.tag_name?.replace(/^v/, '') || data.name

        if (latestVersion) {
          this.pluginVersionCache.set(plugin.id, {
            version: latestVersion,
            lastCheck: Date.now(),
          })

          const hasUpdate = this.compareVersions(latestVersion, plugin.version) > 0
          return {
            hasUpdate,
            latestVersion: hasUpdate ? latestVersion : undefined,
            currentVersion: plugin.version,
            canUpdate: true,
          }
        }
      }
    }
    catch (e) {
      pluginLogger.warn(`检查 GitHub 更新失败 (${plugin.githubRepo}):`, e instanceof Error ? e.message : String(e))
    }

    return { hasUpdate: false, currentVersion: plugin.version, canUpdate: true }
  }

  /**
   * 更新插件
   * @param pluginId 插件ID
   */
  async updatePlugin(pluginId: string): Promise<StoragePlugin | null> {
    try {
      const plugin = this.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      if (plugin.isBuiltin) {
        throw new Error('内置插件不能更新')
      }

      // 本地安装的插件不支持在线更新
      if (plugin.installSource === 'local') {
        throw new Error('本地导入的插件不支持在线更新，请重新导入')
      }

      pluginLogger.info(`开始更新插件: ${pluginId}`)

      // 先卸载旧版本
      await this.uninstallPlugin(pluginId)

      // 根据安装来源选择更新方式
      if (plugin.installSource === 'github' && plugin.githubRepo) {
        const updatedPlugin = await this.installFromGitHub(plugin.githubRepo)
        pluginLogger.info(`插件从 GitHub 更新成功: ${pluginId}`)
        return updatedPlugin
      }

      // npm 安装的插件
      const packageName = plugin.npmPackage || this.getPluginPackageName(plugin)
      if (!packageName) {
        throw new Error('插件缺少包名，无法更新')
      }

      const updatedPlugin = await this.installNpmPlugin(packageName)
      pluginLogger.info(`插件更新成功: ${pluginId}`)
      return updatedPlugin
    }
    catch (e) {
      pluginLogger.error(`插件更新失败: ${pluginId}`, e)
      throw e
    }
  }

  /**
   * 获取插件的 npm 包名
   */
  private getPluginPackageName(plugin: StoragePlugin): string | null {
    if (plugin.npmPackage) {
      return plugin.npmPackage
    }

    if (!plugin.path) {
      return null
    }

    const packageJsonPath = path.join(plugin.path, 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      return null
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      return packageJson.plugin?.npmPackage || packageJson.name || null
    }
    catch {
      return null
    }
  }

  /**
   * 批量检查所有插件更新
   */
  async checkAllPluginsUpdate(): Promise<Array<{ pluginId: string, pluginName: string, hasUpdate: boolean, latestVersion?: string, currentVersion: string, canUpdate?: boolean }>> {
    const results = []
    const plugins = Array.from(this.plugins.values()).filter(p => !p.isBuiltin)

    for (const plugin of plugins) {
      try {
        const updateInfo = await this.checkPluginUpdate(plugin.id)
        results.push({
          pluginId: plugin.id,
          pluginName: plugin.name,
          ...updateInfo,
        })
      }
      catch (e) {
        pluginLogger.error(`检查插件更新失败: ${plugin.id}`, e)
      }
    }

    return results
  }

  /**
   * 批量更新所有插件
   */
  async updateAllPlugins(): Promise<Array<{ pluginId: string, success: boolean, error?: string }>> {
    const updateChecks = await this.checkAllPluginsUpdate()
    // 只更新 hasUpdate 且 canUpdate 为 true 的插件
    const pluginsToUpdate = updateChecks.filter(p => p.hasUpdate && p.canUpdate !== false)
    const results = []

    for (const pluginInfo of pluginsToUpdate) {
      try {
        await this.updatePlugin(pluginInfo.pluginId)
        results.push({ pluginId: pluginInfo.pluginId, success: true })
      }
      catch (e) {
        results.push({
          pluginId: pluginInfo.pluginId,
          success: false,
          error: e instanceof Error ? e.message : String(e),
        })
      }
    }

    return results
  }

  /**
   * 比较版本号
   * @returns 1: v1 > v2, 0: v1 = v2, -1: v1 < v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.replace(/^v/, '').split('.').map(Number)
    const parts2 = v2.replace(/^v/, '').split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0
      const part2 = parts2[i] || 0

      if (part1 > part2)
        return 1
      if (part1 < part2)
        return -1
    }

    return 0
  }

  /**
   * 从 GitHub 安装插件
   * @param repoUrl GitHub 仓库地址 (格式: username/repo 或完整 URL)
   */
  async installFromGitHub(repoUrl: string): Promise<StoragePlugin | null> {
    try {
      // 解析仓库信息
      let owner: string
      let repo: string

      if (repoUrl.includes('github.com')) {
        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
        if (!match) {
          throw new Error('无效的 GitHub 仓库地址')
        }
        owner = match[1]
        repo = match[2].replace(/\.git$/, '')
      }
      else if (repoUrl.includes('/')) {
        const parts = repoUrl.split('/')
        owner = parts[0]
        repo = parts[1]
      }
      else {
        throw new Error('无效的仓库格式，请使用 username/repo 或完整 URL')
      }

      pluginLogger.info(`从 GitHub 安装插件: ${owner}/${repo}`)

      // 获取最新 release
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'GioPic/1.0.0',
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`获取 GitHub release 失败: ${response.status} ${response.statusText}`)
      }

      const releaseData = await response.json()

      // 查找插件包文件 (.tgz)
      const asset = releaseData.assets?.find((a: any) =>
        a.name.endsWith('.tgz') || a.name.endsWith('.tar.gz'),
      )

      if (!asset) {
        throw new Error('未找到可用的插件包文件 (.tgz)')
      }

      pluginLogger.info(`找到插件包: ${asset.name}`)

      // 下载插件包
      const tempDir = path.join(this.pluginsDir, '.temp', `github_${Date.now()}`)
      fs.mkdirSync(tempDir, { recursive: true })

      const downloadUrl = asset.browser_download_url
      const downloadController = new AbortController()
      const downloadTimeoutId = setTimeout(() => downloadController.abort(), 60000)

      const downloadResponse = await fetch(downloadUrl, {
        headers: { 'User-Agent': 'GioPic/1.0.0' },
        signal: downloadController.signal,
      })

      clearTimeout(downloadTimeoutId)

      if (!downloadResponse.ok) {
        throw new Error(`下载插件包失败: ${downloadResponse.status}`)
      }

      const buffer = Buffer.from(await downloadResponse.arrayBuffer())
      const tgzPath = path.join(tempDir, asset.name)
      fs.writeFileSync(tgzPath, buffer)

      // 解压并安装
      const extractDir = path.join(tempDir, 'extracted')
      fs.mkdirSync(extractDir, { recursive: true })

      const packageDir = await this.extractPackage(tgzPath, extractDir)
      const { pluginInfo } = this.validatePluginPackage(packageDir)
      const installedPlugin = await this.installAndLoadPlugin(packageDir, pluginInfo, {
        installSource: 'github',
        githubRepo: `${owner}/${repo}`,
      })

      // 清理临时文件
      fs.rmSync(tempDir, { recursive: true, force: true })

      pluginLogger.info(`从 GitHub 安装插件成功: ${installedPlugin.name}`)
      return installedPlugin
    }
    catch (e) {
      pluginLogger.error(`从 GitHub 安装插件失败: ${repoUrl}`, e)
      throw new Error(`从 GitHub 安装失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  /**
   * 获取远程维护的推荐插件配置
   */
  private async getRemoteRecommendedPluginConfig(): Promise<RemoteRecommendedPluginConfig | null> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(this.recommendedPluginsConfigUrl, {
        headers: { 'User-Agent': 'GioPic/1.0.0' },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        pluginLogger.warn(`获取远程推荐插件配置失败: ${response.status}`)
        return null
      }

      const data = await response.json() as RemoteRecommendedPluginConfig
      if (!data.recommendedPlugins || !Array.isArray(data.recommendedPlugins)) {
        pluginLogger.warn('远程推荐插件配置格式无效')
        return null
      }

      return data
    }
    catch (e) {
      pluginLogger.warn('获取远程推荐插件配置失败:', e instanceof Error ? e.message : String(e))
      return null
    }
  }

  /**
   * 根据包名获取 npm 插件信息
   */
  private async getPackageMetadata(packageName: string, packageUrl: string): Promise<NpmSearchResult | null> {
    try {
      const encodedName = packageName.startsWith('@')
        ? packageName.replace('/', '%2F')
        : packageName
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${packageUrl}/${encodedName}`, {
        headers: { 'User-Agent': 'GioPic/1.0.0' },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return null
      }

      const data = await response.json() as any
      const latestVersion = data['dist-tags']?.latest
      const latest = latestVersion ? data.versions?.[latestVersion] : null
      if (!latest) {
        return null
      }

      return {
        name: latest.name,
        version: latest.version,
        description: latest.description || '',
        author: typeof latest.author === 'string' ? { name: latest.author } : latest.author,
        date: data.time?.[latest.version] || data.time?.modified || new Date().toISOString(),
        keywords: latest.keywords,
        homepage: latest.homepage,
      }
    }
    catch {
      return null
    }
  }

  /**
   * 获取推荐插件列表
   */
  async getRecommendedPlugins(): Promise<NpmSearchResult[]> {
    try {
      pluginLogger.info('获取推荐插件列表')

      const remoteConfig = await this.getRemoteRecommendedPluginConfig()
      if (remoteConfig?.recommendedPlugins?.length) {
        for (const registry of this.npmRegistries) {
          try {
            const results: NpmSearchResult[] = []

            for (const item of remoteConfig.recommendedPlugins) {
              const metadata = await this.getPackageMetadata(item.name, registry.packageUrl)
              if (!metadata) {
                continue
              }

              results.push({
                ...metadata,
                description: item.reason || metadata.description,
                recommendScore: 999,
              })
            }

            if (results.length > 0) {
              pluginLogger.info(`获取远程推荐插件成功，共 ${results.length} 个`)
              return results
            }
          }
          catch (e) {
            pluginLogger.warn(`${registry.name} 获取远程推荐插件失败:`, e instanceof Error ? e.message : String(e))
          }
        }
      }

      for (const registry of this.npmRegistries) {
        try {
          const searchUrl = `${registry.searchUrl}?text=giopic-plugin&size=20`
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)

          const response = await fetch(searchUrl, {
            headers: { 'User-Agent': 'GioPic/1.0.0' },
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            continue
          }

          const data = await response.json()

          if (!data.objects || !Array.isArray(data.objects)) {
            continue
          }

          const results: NpmSearchResult[] = data.objects
            .filter((item: any) => {
              const pkg = item.package
              return pkg.name.includes('giopic-plugin')
                && (pkg.keywords?.includes('giopic')
                  || pkg.keywords?.includes('image')
                  || pkg.description?.toLowerCase().includes('giopic'))
            })
            .map((item: any) => {
              const pkg = item.package
              const score = item.score?.detail || {}
              const recommendScore = (score.quality || 0) * 0.3
                + (score.popularity || 0) * 0.5
                + (score.maintenance || 0) * 0.2

              return {
                name: pkg.name,
                version: pkg.version,
                description: pkg.description || '',
                author: pkg.author,
                date: pkg.date,
                keywords: pkg.keywords,
                homepage: pkg.homepage,
                downloadCount: pkg.downloads || 0,
                recommendScore,
              }
            })
            .sort((a: any, b: any) => b.recommendScore - a.recommendScore)
            .slice(0, 10)

          pluginLogger.info(`获取推荐插件成功，共 ${results.length} 个`)
          return results
        }
        catch (e) {
          pluginLogger.warn(`${registry.name} 获取推荐插件失败:`, e instanceof Error ? e.message : String(e))
        }
      }

      return []
    }
    catch (e) {
      pluginLogger.error('获取推荐插件失败', e)
      return []
    }
  }

  async exportPluginsBackup(): Promise<string> {
    try {
      pluginLogger.info('导出插件备份')

      const plugins = Array.from(this.plugins.values()).filter(p => !p.isBuiltin)
      const backup = {
        version: '1.1.0',
        exportDate: new Date().toISOString(),
        plugins: plugins.map((plugin) => {
          const packageName = this.getPluginPackageName(plugin)

          return {
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            packageName: packageName || plugin.id,
            installSource: plugin.installSource || 'npm',
            githubRepo: plugin.githubRepo,
            enabled: plugin.enabled,
          }
        }),
      }

      const backupJson = JSON.stringify(backup, null, 2)
      pluginLogger.info(`导出 ${backup.plugins.length} 个插件`)

      return backupJson
    }
    catch (e) {
      pluginLogger.error('导出插件备份失败', e)
      throw new Error(`导出插件备份失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  async importPluginsBackup(backupJson: string): Promise<{ success: number, failed: number, skipped: number, errors: string[] }> {
    try {
      pluginLogger.info('导入插件备份')

      const backup = JSON.parse(backupJson)

      if (!backup.plugins || !Array.isArray(backup.plugins)) {
        throw new Error('无效的备份文件格式')
      }

      let success = 0
      let failed = 0
      let skipped = 0
      const errors: string[] = []

      for (const pluginInfo of backup.plugins) {
        try {
          // 跳过已存在的插件
          if (this.plugins.has(pluginInfo.id)) {
            pluginLogger.info(`插件已存在，跳过: ${pluginInfo.name}`)
            skipped++
            continue
          }

          // 本地安装的插件无法自动恢复
          if (pluginInfo.installSource === 'local') {
            pluginLogger.warn(`本地插件无法自动恢复: ${pluginInfo.name}`)
            errors.push(`${pluginInfo.name}: 本地插件无法自动恢复，请手动导入`)
            failed++
            continue
          }

          // 根据安装来源恢复插件
          if (pluginInfo.installSource === 'github' && pluginInfo.githubRepo) {
            await this.installFromGitHub(pluginInfo.githubRepo)
          }
          else {
            await this.installNpmPlugin(pluginInfo.packageName)
          }

          // 恢复启用状态
          if (pluginInfo.enabled === false) {
            await this.disablePlugin(pluginInfo.id)
          }

          success++
          pluginLogger.info(`导入插件成功: ${pluginInfo.name}`)
        }
        catch (e) {
          failed++
          const errorMsg = `${pluginInfo.name}: ${e instanceof Error ? e.message : '未知错误'}`
          errors.push(errorMsg)
          pluginLogger.error(`导入插件失败: ${pluginInfo.name}`, e)
        }
      }

      pluginLogger.info(`插件导入完成: 成功 ${success}, 失败 ${failed}, 跳过 ${skipped}`)
      return { success, failed, skipped, errors }
    }
    catch (e) {
      pluginLogger.error('导入插件备份失败', e)
      throw new Error(`导入插件备份失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  async getPluginDependencies(pluginId: string): Promise<{ dependencies: Record<string, string>, devDependencies: Record<string, string> }> {
    try {
      const plugin = this.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      if (plugin.isBuiltin) {
        return { dependencies: {}, devDependencies: {} }
      }

      const packageJsonPath = path.join(plugin.path!, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        return { dependencies: {}, devDependencies: {} }
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
      }
    }
    catch (e) {
      pluginLogger.error(`获取插件依赖失败: ${pluginId}`, e)
      throw e
    }
  }

  async checkPluginCompatibility(pluginId: string): Promise<{ compatible: boolean, issues: string[] }> {
    try {
      const plugin = this.getPlugin(pluginId)
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`)
      }

      const issues: string[] = []

      if (plugin.isBuiltin) {
        return { compatible: true, issues: [] }
      }

      const packageJsonPath = path.join(plugin.path!, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        issues.push('缺少 package.json 文件')
        return { compatible: false, issues }
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      if (packageJson.engines?.giopic) {
        const requiredVersion = packageJson.engines.giopic
        issues.push(`需要 GioPic 版本: ${requiredVersion}`)
      }

      const distPath = path.join(plugin.path!, 'dist', 'index.js')
      if (!fs.existsSync(distPath)) {
        issues.push('缺少编译后的文件 (dist/index.js)')
      }

      return {
        compatible: issues.length === 0,
        issues,
      }
    }
    catch (e) {
      pluginLogger.error(`检查插件兼容性失败: ${pluginId}`, e)
      throw e
    }
  }

  async installNpmPluginWithRetry(packageName: string, maxRetries: number = 3): Promise<StoragePlugin | null> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        pluginLogger.info(`尝试安装插件 (${attempt}/${maxRetries}): ${packageName}`)
        const plugin = await this.installNpmPlugin(packageName)
        return plugin
      }
      catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e))
        pluginLogger.warn(`安装失败 (${attempt}/${maxRetries}): ${lastError.message}`)

        if (attempt < maxRetries) {
          const delay = attempt * 1000
          pluginLogger.info(`等待 ${delay}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError || new Error('安装失败')
  }
}

export const pluginManager = new PluginManager()
