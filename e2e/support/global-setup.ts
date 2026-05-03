import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)
const mainEntry = path.join(repoRoot, 'dist-electron/main/index.js')
const rendererEntry = path.join(repoRoot, 'dist/index.html')

export default async function globalSetup() {
  if (
    process.env.GIOPIC_E2E_SKIP_BUILD === '1'
    && fs.existsSync(mainEntry)
    && fs.existsSync(rendererEntry)
  ) {
    return
  }

  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  execFileSync(pnpmCommand, ['run', 'build:app'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  })
}
