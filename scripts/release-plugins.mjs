import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const pluginPackagePaths = [
  'packages/core/package.json',
  'packages/lsky-plugin/package.json',
  'packages/lskypro-plugin/package.json',
  'packages/s3-plugin/package.json',
]

function run(command, options = {}) {
  console.log(`\n> ${command}`)
  execSync(command, {
    cwd: rootDir,
    stdio: 'inherit',
    ...options,
  })
}

function getArg(name) {
  const arg = process.argv.find(item => item.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : ''
}

function ensureCleanWorktree() {
  const output = execSync('git status --porcelain', {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()

  if (output) {
    console.error('插件发布前请先保持工作区干净，再重新执行命令。')
    process.exit(1)
  }
}

function ensureNpmAuth() {
  try {
    const whoami = execSync('npm whoami --registry https://registry.npmjs.org', {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()

    console.log(`npm 当前登录账号: ${whoami}`)
  }
  catch {
    console.error('npm 登录校验失败，请先执行 npm login，或检查当前终端中的 NPM_TOKEN 是否有效。')
    process.exit(1)
  }
}

function snapshotFiles() {
  return pluginPackagePaths.map((file) => {
    const absolutePath = path.join(rootDir, file)
    return {
      file,
      absolutePath,
      content: fs.readFileSync(absolutePath, 'utf-8'),
    }
  })
}

function restoreFiles(snapshot) {
  for (const item of snapshot) {
    fs.writeFileSync(item.absolutePath, item.content, 'utf-8')
  }
}

function getCurrentPluginVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, pluginPackagePaths[0]), 'utf-8'))
  return pkg.version
}

async function main() {
  const release = process.argv[2]
  const preid = getArg('--preid')
  const npmTag = getArg('--tag') || 'latest'

  if (!release) {
    console.error('请提供 release 类型，例如: patch / minor / major / prerelease')
    process.exit(1)
  }

  ensureCleanWorktree()
  ensureNpmAuth()

  const snapshot = snapshotFiles()
  const bumpArgs = [release]
  if (preid)
    bumpArgs.push(`--preid=${preid}`)

  try {
    run(`node scripts/bump-plugins.mjs ${bumpArgs.join(' ')}`)
    run(`node scripts/publish-plugins.mjs --tag=${npmTag}`)

    const newVersion = getCurrentPluginVersion()
    run(`git add ${pluginPackagePaths.join(' ')}`)
    run(`git commit -m "release(plugins): v${newVersion}"`)
    run(`git tag plugins-v${newVersion}`)
  }
  catch (error) {
    restoreFiles(snapshot)
    console.error('\n插件发布未完成，已还原本地 package.json 版本变更。')
    console.error('如果报错包含 E404 / 403，请重点检查 npm 账号对当前 scope 的发布权限。')
    throw error
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
