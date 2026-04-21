import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { versionBump } from 'bumpp'

const rootDir = process.cwd()
const pluginPackagePaths = [
  'packages/core/package.json',
  'packages/lsky-plugin/package.json',
  'packages/lskypro-plugin/package.json',
  'packages/s3-plugin/package.json',
]

function run(command) {
  console.log(`\n> ${command}`)
  execSync(command, { stdio: 'inherit', cwd: rootDir })
}

function getArg(name) {
  const arg = process.argv.find(item => item.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : ''
}

async function main() {
  const release = process.argv[2]
  const preid = getArg('--preid')
  const gitTag = process.argv.includes('--git-tag')
  const gitCommit = process.argv.includes('--git-commit')
  const gitPush = process.argv.includes('--git-push')

  if (!release) {
    console.error('请提供版本号或 release 类型，例如: patch / minor / major / prerelease / 1.2.3')
    process.exit(1)
  }

  const files = pluginPackagePaths.map(file => path.join(rootDir, file))

  const result = await versionBump({
    files,
    release,
    preid: preid || undefined,
    commit: false,
    tag: false,
    push: false,
    confirm: false,
    execute: false,
  })

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf-8')
    const pkg = JSON.parse(raw)

    if (pkg.plugin && typeof pkg.plugin === 'object') {
      pkg.plugin.version = result.newVersion
      fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8')
    }
  }

  console.log(`插件版本已同步到 ${result.newVersion}`)

  if (gitCommit) {
    run(`git add ${pluginPackagePaths.join(' ')}`)
    run(`git commit -m "release(plugins): v${result.newVersion}"`)
  }

  if (gitTag) {
    run(`git tag plugins-v${result.newVersion}`)
  }

  if (gitPush) {
    run('git push')
    if (gitTag) {
      run('git push --tags')
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
