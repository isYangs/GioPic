import { defineStore } from 'pinia'
import { vi } from 'vitest'
import { computed, onMounted, onUnmounted, reactive, ref, toRefs, watch } from 'vue'

vi.mock('pinia-plugin-persistedstate', () => ({
  default: () => ({}),
}))

const ipcRendererMock = {
  on: vi.fn(),
  off: vi.fn(),
  send: vi.fn(),
  invoke: vi.fn().mockResolvedValue(undefined),
  callMain: vi.fn().mockResolvedValue(undefined),
}

vi.stubGlobal('ipcRenderer', ipcRendererMock)

vi.stubGlobal('defineStore', defineStore)
vi.stubGlobal('ref', ref)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('toRefs', toRefs)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onUnmounted', onUnmounted)

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'ipcRenderer', {
    value: ipcRendererMock,
    writable: true,
  })
}
