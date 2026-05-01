import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const releaseDir = path.join(rootDir, 'release')

const requiredPackages = [
  'axios',
  'follow-redirects',
  'form-data',
  'proxy-from-env',
  'asynckit',
  'combined-stream',
  'delayed-stream',
  'es-set-tostringtag',
  'hasown',
  'mime-types',
  'mime-db',
  'es-errors',
  'get-intrinsic',
  'has-tostringtag',
  'call-bind-apply-helpers',
  'es-define-property',
  'es-object-atoms',
  'function-bind',
  'get-proto',
  'gopd',
  'has-symbols',
  'math-intrinsics',
  'dunder-proto',
]

const importChecks = [
  'node_modules/axios/lib/adapters/http.js',
  'node_modules/form-data/lib/form_data.js',
]

function findAppAsars(dir, results = []) {
  if (!existsSync(dir))
    return results

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      findAppAsars(fullPath, results)
    }
    else if (entry === 'app.asar') {
      results.push(fullPath)
    }
  }

  return results
}

function packageJsonPath(extractedDir, packageName) {
  return path.join(extractedDir, 'node_modules', ...packageName.split('/'), 'package.json')
}

function extractAsar(asarPath, destination) {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
  const result = spawnSync(pnpm, ['exec', 'asar', 'extract', asarPath, destination], {
    cwd: rootDir,
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    throw new Error(`Failed to extract ${path.relative(rootDir, asarPath)}`)
  }
}

async function verifyAsar(asarPath) {
  const tmpRoot = mkdtempSync(path.join(tmpdir(), 'giopic-app-asar-'))
  const extractedDir = path.join(tmpRoot, 'app')

  try {
    extractAsar(asarPath, extractedDir)

    const missing = requiredPackages.filter(packageName => !existsSync(packageJsonPath(extractedDir, packageName)))
    if (missing.length > 0) {
      throw new Error(`Missing runtime packages in app.asar: ${missing.join(', ')}`)
    }

    for (const target of importChecks) {
      const targetPath = path.join(extractedDir, ...target.split('/'))
      if (!existsSync(targetPath)) {
        throw new Error(`Missing import check target in app.asar: ${target}`)
      }
      await import(pathToFileURL(targetPath).href)
    }

    console.log(`Verified packaged runtime dependencies: ${path.relative(rootDir, asarPath)}`)
  }
  finally {
    rmSync(tmpRoot, { recursive: true, force: true })
  }
}

const asarPaths = findAppAsars(releaseDir)

if (asarPaths.length === 0) {
  throw new Error('No app.asar files found under release/. Run electron-builder before this verification.')
}

for (const asarPath of asarPaths) {
  await verifyAsar(asarPath)
}
