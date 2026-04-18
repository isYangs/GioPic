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

const pluginPackages = pluginPackagePaths.map((file) => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, file), 'utf-8'))
  return pkg.name
})

function run(command) {
  console.log(`\n> ${command}`)
  execSync(command, { cwd: rootDir, stdio: 'inherit' })
}

function getArg(name) {
  const arg = process.argv.find(item => item.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : ''
}

const target = getArg('--filter')
const npmTag = getArg('--tag') || 'latest'
const dryRun = process.argv.includes('--dry-run')
const skipBuild = process.argv.includes('--skip-build')
const packages = target ? pluginPackages.filter(name => name === target) : pluginPackages

if (!packages.length) {
  console.error('未找到要发布的插件包，请检查 --filter 参数')
  process.exit(1)
}

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

if (!skipBuild) {
  run('pnpm run build:plugins')
}

for (const pkg of packages) {
  const publishCommand = dryRun
    ? `pnpm --filter ${pkg} publish --access public --tag ${npmTag} --dry-run --no-git-checks`
    : `pnpm --filter ${pkg} publish --access public --tag ${npmTag} --no-git-checks`

  try {
    run(publishCommand)
  }
  catch (error) {
    console.error(`\n发布 ${pkg} 失败。`)
    console.error('如果报错包含 E404 / 403，请检查当前 npm 账号是否有对应 scope 的发布权限。')
    throw error
  }
}
