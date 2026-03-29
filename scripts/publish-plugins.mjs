import { execSync } from 'node:child_process'
import process from 'node:process'

const pluginPackages = [
  '@giopic/core',
  '@giopic/lsky-plugin',
  '@giopic/lskypro-plugin',
  '@giopic/s3-plugin',
]

function run(command) {
  console.log(`\n> ${command}`)
  execSync(command, { stdio: 'inherit' })
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

if (!skipBuild) {
  run('pnpm run build:plugins')
}

for (const pkg of packages) {
  const publishCommand = dryRun
    ? `pnpm --filter ${pkg} publish --access public --tag ${npmTag} --dry-run --no-git-checks`
    : `pnpm --filter ${pkg} publish --access public --tag ${npmTag} --no-git-checks`
  run(publishCommand)
}
