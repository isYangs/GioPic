import { execSync } from 'node:child_process'
import process from 'node:process'
import { versionBump } from 'bumpp'

const rootDir = process.cwd()
const appPackagePath = 'package.json'

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

  const result = await versionBump({
    files: [`${rootDir}/${appPackagePath}`],
    release,
    preid: preid || undefined,
    commit: false,
    tag: false,
    push: false,
    confirm: false,
    execute: false,
  })

  console.log(`应用版本已更新到 ${result.newVersion}`)

  if (gitCommit) {
    run(`git add ${appPackagePath}`)
    run(`git commit -m "release(app): v${result.newVersion}"`)
  }

  if (gitTag) {
    run(`git tag v${result.newVersion}`)
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
