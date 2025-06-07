import type { StoragePlugin } from '@giopic/core'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
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
}

export class PluginManager {
  private pluginsDir: string
  private plugins: Map<string, StoragePlugin> = new Map()
  private builtinPluginIds: Set<string> = new Set()

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
    const searchQuery = query ? `giopic-plugin-${query}` : 'giopic-plugin'
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
      pluginLogger.info(`${packageName}`)
      const tempDir = path.join(this.pluginsDir, '.temp', packageName.replace(/[/\\:*?"<>|]/g, '_'))

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      let installSuccess = false
      let lastError: Error | null = null

      for (const registry of this.npmRegistries) {
        try {
          pluginLogger.info(`尝试使用 ${registry.name} 安装插件: ${packageName}`)

          const command = `npm pack ${packageName} --pack-destination "${tempDir}" --registry ${registry.packageUrl} --silent`
          execSync(command, {
            encoding: 'utf-8',
            timeout: 60000,
          })

          installSuccess = true
          pluginLogger.info(`通过 ${registry.name} 安装成功`)
          break
        }
        catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e))
          pluginLogger.warn(`通过 ${registry.name} 安装失败:`, lastError.message)
        }
      }

      if (!installSuccess) {
        if (this.npmRegistries.length === 1) {
          const registryName = this.npmRegistries[0].name
          throw lastError || new Error(`通过${registryName}无法安装插件，请检查网络连接或更换插件源`)
        }
        else {
          throw lastError || new Error('所有插件源都无法安装插件')
        }
      }

      const files = fs.readdirSync(tempDir)
      const tgzFile = files.find(file => file.endsWith('.tgz'))
      if (!tgzFile) {
        throw new Error('下载的插件包未找到')
      }

      const tgzPath = path.join(tempDir, tgzFile)
      const extractDir = path.join(tempDir, 'extracted')
      fs.mkdirSync(extractDir, { recursive: true })

      const packageDir = await this.extractPackage(tgzPath, extractDir)
      const { pluginInfo } = this.validatePluginPackage(packageDir)
      const installedPlugin = await this.installAndLoadPlugin(packageDir, pluginInfo)

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
          const plugin: StoragePlugin = {
            ...packageJson.plugin,
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
        const installedPlugin = await this.installAndLoadPlugin(packageDir, pluginInfo)
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
        return await import(plugin.npmPackage)
      }

      if (!plugin.path) {
        throw new Error(`插件 ${pluginId} 缺少路径信息`)
      }

      const mainPath = path.join(plugin.path, 'dist', 'index.js')

      if (!fs.existsSync(mainPath)) {
        throw new Error(`插件主文件不存在: ${mainPath}`)
      }

      if (platform.isWindows) {
        return await import(`file://${mainPath.replace(/\\/g, '/')}`)
      }

      return await import(mainPath)
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

    return { packageJson, pluginInfo }
  }

  /**
   * 安装插件到目标目录并加载
   * @param packageDir 插件包目录
   * @param pluginInfo 插件信息
   */
  private async installAndLoadPlugin(packageDir: string, pluginInfo: any): Promise<StoragePlugin> {
    const finalPluginDir = path.join(this.pluginsDir, pluginInfo.id)

    if (fs.existsSync(finalPluginDir)) {
      fs.rmSync(finalPluginDir, { recursive: true, force: true })
    }

    await this.installPluginViaNpm(packageDir, pluginInfo.id)

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
   */
  private async installPluginViaNpm(packageDir: string, pluginId: string) {
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

      const pluginPackageJson = {
        name: originalPackageJson.name || `giopic-plugin-${pluginId}`,
        version: originalPackageJson.version || '1.0.0',
        main: './dist/index.js',
        type: 'module',
        dependencies: {
          '@giopic/core': '^0.1.0',
        },
        plugin: originalPackageJson.plugin,
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
   */
  private async installDependencies(pluginDir: string) {
    try {
      const appRoot = process.env.APP_ROOT || path.join(__dirname, '../..')
      const localCorePath = path.join(appRoot, 'packages', 'core')

      if (!fs.existsSync(localCorePath)) {
        throw new Error('找不到本地@giopic/core包')
      }

      execSync(`npm install file:${localCorePath} --silent`, {
        cwd: pluginDir,
        encoding: 'utf-8',
        timeout: 60000,
        stdio: 'pipe',
      })

      pluginLogger.info('从本地packages/core安装依赖成功')
    }
    catch (e) {
      pluginLogger.error('安装插件依赖失败:', e)
      throw new Error(`依赖安装失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
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
}

export const pluginManager = new PluginManager()
