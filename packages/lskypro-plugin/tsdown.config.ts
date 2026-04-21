import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  external: ['node:stream', 'node:buffer'],
})
