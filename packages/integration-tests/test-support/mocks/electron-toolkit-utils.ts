import { vi } from 'vitest'

export const is = {
  dev: true,
}

export const platform = {
  isMacOS: vi.fn(() => true),
  isWindows: vi.fn(() => false),
  isLinux: vi.fn(() => false),
}

export const electronApp = {
  setAutoLaunch: vi.fn(),
}
