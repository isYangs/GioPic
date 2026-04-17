import { spawn } from 'node:child_process'

const env = {
  ...process.env,
  TSESTREE_SUPPRESS_UNSUPPORTED_TYPESCRIPT_VERSION_WARNING:
    process.env.TSESTREE_SUPPRESS_UNSUPPORTED_TYPESCRIPT_VERSION_WARNING ?? 'true',
}

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const args = ['exec', 'eslint', ...process.argv.slice(2)]

const child = spawn(command, args, {
  env,
  stdio: 'inherit',
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
