import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  external: ['node:stream', 'node:buffer', '@aws-sdk/client-s3', '@aws-sdk/lib-storage'],
})
