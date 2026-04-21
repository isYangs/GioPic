import * as pinia from 'pinia'
import { vi } from 'vitest'
import * as vue from 'vue'

const fallbackStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(() => null),
  length: 0,
}

if (!globalThis.localStorage || typeof globalThis.localStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: fallbackStorage,
  })
}

if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: fallbackStorage,
  })
}

if (!window.ipcRenderer) {
  Object.defineProperty(window, 'ipcRenderer', {
    configurable: true,
    writable: true,
    value: {
      invoke: vi.fn(),
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      callMain: vi.fn(),
    },
  })
}

Object.assign(globalThis, {
  ...pinia,
  ...vue,
})
