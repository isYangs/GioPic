import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import logger from '../utils/logger'
import { getPluginTemplatesPath } from '../utils/runtime-paths'

const devToolsLogger = logger.scope('PluginDevTools')

export class PluginDevTools {
  private templatesDir: string

  constructor() {
    this.templatesDir = getPluginTemplatesPath()
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true })
    }
  }

  async generatePluginTemplate(options: {
    name: string
    id: string
    author: string
    description: string
    type: string
    outputDir: string
  }): Promise<string> {
    try {
      const { name, id, author, description, type, outputDir } = options

      devToolsLogger.info(`生成插件模板: ${name} (${id})`)

      const pluginDir = path.join(outputDir, id)

      if (fs.existsSync(pluginDir)) {
        throw new Error(`目录已存在: ${pluginDir}`)
      }

      fs.mkdirSync(pluginDir, { recursive: true })

      const srcDir = path.join(pluginDir, 'src')
      fs.mkdirSync(srcDir, { recursive: true })

      const packageJson = {
        name: `giopic-plugin-${id}`,
        version: '1.0.0',
        description,
        main: './dist/index.js',
        type: 'module',
        scripts: {
          build: 'tsup',
          dev: 'tsup --watch',
          pack: 'pnpm build && pnpm pack',
        },
        keywords: ['giopic', 'giopic-plugin', 'image', type],
        author,
        license: 'MIT',
        peerDependencies: {
          '@giopic/core': '^0.1.0',
        },
        devDependencies: {
          '@giopic/core': '^0.1.0',
          'tsup': '^8.0.0',
          'typescript': '^5.0.0',
        },
        plugin: {
          id,
          name,
          version: '1.0.0',
          author,
          description,
          type,
        },
      }

      fs.writeFileSync(
        path.join(pluginDir, 'package.json'),
        JSON.stringify(packageJson, null, 2),
      )

      const tsconfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          resolveJsonModule: true,
          declaration: true,
          outDir: './dist',
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      }

      fs.writeFileSync(
        path.join(pluginDir, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2),
      )

      const tsupConfig = `import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@giopic/core'],
})
`

      fs.writeFileSync(path.join(pluginDir, 'tsup.config.ts'), tsupConfig)

      const indexTs = `import type { SettingSchema, UploaderParams, UploaderResponse } from '@giopic/core'

export const settingSchema: SettingSchema = {
  items: [
    {
      field: 'apiUrl',
      label: 'API 地址',
      description: '存储服务的 API 地址',
      type: 'text',
      placeholder: 'https://example.com/api',
      required: true,
    },
    {
      field: 'token',
      label: '访问令牌',
      description: '用于认证的访问令牌',
      type: 'text',
      placeholder: '请输入访问令牌',
      required: true,
    },
  ],
  defaultValues: {
    apiUrl: '',
    token: '',
  },
}

export function createUploader(config: Record<string, any>) {
  return {
    async upload(params: UploaderParams): Promise<UploaderResponse> {
      const { fileName, fileBuffer, base64Data, mimetype, size } = params
      const { apiUrl, token } = config

      // TODO: 实现上传逻辑
      // 示例：
      // const response = await fetch(\`\${apiUrl}/upload\`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': \`Bearer \${token}\`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     file: base64Data,
      //     filename: fileName,
      //   }),
      // })
      //
      // const data = await response.json()
      //
      // return {
      //   key: data.id,
      //   name: fileName,
      //   size,
      //   mimetype,
      //   url: data.url,
      //   origin_name: fileName,
      // }

      throw new Error('请实现上传逻辑')
    },
  }
}

export default {
  settingSchema,
  createUploader,
}
`

      fs.writeFileSync(path.join(srcDir, 'index.ts'), indexTs)

      const readme = `# ${name}

${description}

## 安装

\`\`\`bash
pnpm install
\`\`\`

## 开发

\`\`\`bash
pnpm dev
\`\`\`

## 构建

\`\`\`bash
pnpm build
\`\`\`

## 打包

\`\`\`bash
pnpm pack
\`\`\`

## 配置项

- **apiUrl**: API 地址
- **token**: 访问令牌

## 许可证

MIT
`

      fs.writeFileSync(path.join(pluginDir, 'README.md'), readme)

      const gitignore = `node_modules
dist
*.tgz
.DS_Store
`

      fs.writeFileSync(path.join(pluginDir, '.gitignore'), gitignore)

      devToolsLogger.info(`插件模板生成成功: ${pluginDir}`)
      return pluginDir
    }
    catch (e) {
      devToolsLogger.error('生成插件模板失败', e)
      throw new Error(`生成插件模板失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  async buildPlugin(pluginDir: string): Promise<void> {
    try {
      devToolsLogger.info(`构建插件: ${pluginDir}`)

      if (!fs.existsSync(pluginDir)) {
        throw new Error(`插件目录不存在: ${pluginDir}`)
      }

      const packageJsonPath = path.join(pluginDir, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('找不到 package.json')
      }

      execSync('pnpm install', {
        cwd: pluginDir,
        encoding: 'utf-8',
        timeout: 120000,
        stdio: 'pipe',
      })

      execSync('pnpm build', {
        cwd: pluginDir,
        encoding: 'utf-8',
        timeout: 60000,
        stdio: 'pipe',
      })

      devToolsLogger.info('插件构建成功')
    }
    catch (e) {
      devToolsLogger.error('插件构建失败', e)
      throw new Error(`插件构建失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  async packPlugin(pluginDir: string): Promise<string> {
    try {
      devToolsLogger.info(`打包插件: ${pluginDir}`)

      if (!fs.existsSync(pluginDir)) {
        throw new Error(`插件目录不存在: ${pluginDir}`)
      }

      await this.buildPlugin(pluginDir)

      const result = execSync('pnpm pack', {
        cwd: pluginDir,
        encoding: 'utf-8',
        timeout: 30000,
      })

      const tgzMatch = result.match(/[\w-]+\.tgz/)
      if (!tgzMatch) {
        throw new Error('打包失败：未找到生成的 .tgz 文件')
      }

      const tgzPath = path.join(pluginDir, tgzMatch[0])

      if (!fs.existsSync(tgzPath)) {
        throw new Error(`打包文件不存在: ${tgzPath}`)
      }

      devToolsLogger.info(`插件打包成功: ${tgzPath}`)
      return tgzPath
    }
    catch (e) {
      devToolsLogger.error('插件打包失败', e)
      throw new Error(`插件打包失败: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  async validatePlugin(pluginDir: string): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    try {
      if (!fs.existsSync(pluginDir)) {
        errors.push('插件目录不存在')
        return { valid: false, errors }
      }

      const packageJsonPath = path.join(pluginDir, 'package.json')
      if (!fs.existsSync(packageJsonPath)) {
        errors.push('缺少 package.json 文件')
        return { valid: false, errors }
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      if (!packageJson.plugin) {
        errors.push('package.json 中缺少 plugin 字段')
      }
      else {
        const plugin = packageJson.plugin
        if (!plugin.id)
          errors.push('plugin.id 字段缺失')
        if (!plugin.name)
          errors.push('plugin.name 字段缺失')
        if (!plugin.version)
          errors.push('plugin.version 字段缺失')
        if (!plugin.type)
          errors.push('plugin.type 字段缺失')
      }

      const srcDir = path.join(pluginDir, 'src')
      if (!fs.existsSync(srcDir)) {
        errors.push('缺少 src 目录')
      }

      const indexPath = path.join(srcDir, 'index.ts')
      if (!fs.existsSync(indexPath)) {
        errors.push('缺少 src/index.ts 文件')
      }

      return { valid: errors.length === 0, errors }
    }
    catch (e) {
      errors.push(`验证失败: ${e instanceof Error ? e.message : '未知错误'}`)
      return { valid: false, errors }
    }
  }
}

export const pluginDevTools = new PluginDevTools()
