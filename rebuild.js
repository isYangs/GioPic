import child from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'

const require = createRequire(import.meta.url)

const better_sqlite3 = require.resolve('better-sqlite3')
const better_sqlite3_root = path.posix.join(better_sqlite3.slice(0, better_sqlite3.lastIndexOf('node_modules')), 'node_modules/better-sqlite3')

const cp = child.spawn(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  [
    'run',
    'build-release',
    `--target=${process.versions.electron}`,
    '--dist-url=https://electronjs.org/headers',
  ],
  {
    cwd: better_sqlite3_root,
    stdio: 'inherit',
    shell: true,
  },
)

cp.on('exit', (code) => {
  if (code === 0) {
    // eslint-disable-next-line no-console
    console.log('Rebuild better-sqlite3 success.')
  }
  else {
    console.error('Failed to rebuild better-sqlite3. Exit code:', code)
  }
  process.exit(code)
})
