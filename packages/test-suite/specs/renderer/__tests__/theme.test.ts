import { vi } from 'vitest'
import { generateCustomColors, getPrimaryColor } from '~/utils/theme'

describe('getPrimaryColor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('light theme', () => {
    it('should return light default color when only theme type is provided', () => {
      const result = getPrimaryColor('light')
      expect(result).toBe('#3a7')
    })

    it('should return light blue color', () => {
      const result = getPrimaryColor('light', 'blue')
      expect(result).toBe('#27f')
    })

    it('should return light purple color', () => {
      const result = getPrimaryColor('light', 'purple')
      expect(result).toBe('#75e')
    })

    it('should return light orange color', () => {
      const result = getPrimaryColor('light', 'orange')
      expect(result).toBe('#e62')
    })

    it('should return light red color', () => {
      const result = getPrimaryColor('light', 'red')
      expect(result).toBe('#e33')
    })

    it('should return conic-gradient string for light custom color', () => {
      const result = getPrimaryColor('light', 'custom')
      expect(result).toContain('conic-gradient')
      expect(result).toContain('#3a7')
      expect(result).toContain('#27f')
      expect(result).toContain('#75e')
      expect(result).toContain('#e62')
      expect(result).toContain('#e33')
    })
  })

  describe('dark theme', () => {
    it('should return dark default color when only theme type is provided', () => {
      const result = getPrimaryColor('dark')
      expect(result).toBe('#7fa')
    })

    it('should return dark blue color', () => {
      const result = getPrimaryColor('dark', 'blue')
      expect(result).toBe('#7bf')
    })

    it('should return dark purple color', () => {
      const result = getPrimaryColor('dark', 'purple')
      expect(result).toBe('#c8f')
    })

    it('should return dark orange color', () => {
      const result = getPrimaryColor('dark', 'orange')
      expect(result).toBe('#f83')
    })

    it('should return dark red color', () => {
      const result = getPrimaryColor('dark', 'red')
      expect(result).toBe('#f66')
    })

    it('should return conic-gradient string for dark custom color', () => {
      const result = getPrimaryColor('dark', 'custom')
      expect(result).toContain('conic-gradient')
      expect(result).toContain('#7fa')
      expect(result).toContain('#7bf')
      expect(result).toContain('#c8f')
      expect(result).toContain('#f83')
      expect(result).toContain('#f66')
    })
  })

  describe('null theme type', () => {
    it('should return light default color when theme type is null', () => {
      const result = getPrimaryColor(null)
      expect(result).toBe('#3a7')
    })

    it('should return light default color when theme type is null and primaryColor is provided', () => {
      const result = getPrimaryColor(null, 'blue')
      expect(result).toBe('#3a7')
    })

    it('should return light default color when theme type is null and primaryColor is custom', () => {
      const result = getPrimaryColor(null, 'custom')
      expect(result).toBe('#3a7')
    })
  })

  describe('undefined theme type', () => {
    it('should return light default color when theme type is undefined', () => {
      const result = getPrimaryColor(undefined)
      expect(result).toBe('#3a7')
    })
  })
})

describe('generateCustomColors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return object with 4 color properties', () => {
    const result = generateCustomColors('#ff0000')
    expect(result).toHaveProperty('primaryColor')
    expect(result).toHaveProperty('primaryColorHover')
    expect(result).toHaveProperty('primaryColorPressed')
    expect(result).toHaveProperty('primaryColorSuppl')
  })

  it('should have primaryColor equal to input', () => {
    const input = '#ff0000'
    const result = generateCustomColors(input)
    expect(result.primaryColor).toBe(input)
  })

  it('should have primaryColorHover and primaryColorSuppl equal (both +20 brightness)', () => {
    const result = generateCustomColors('#ff0000')
    expect(result.primaryColorHover).toBe(result.primaryColorSuppl)
  })

  it('should have primaryColorPressed different from primaryColorHover', () => {
    const result = generateCustomColors('#ff0000')
    expect(result.primaryColorPressed).not.toBe(result.primaryColorHover)
  })

  describe('brightness adjustments', () => {
    it('should make hover color brighter than base', () => {
      const result = generateCustomColors('#808080')
      // Hover adds 20, so RGB values should be higher
      expect(result.primaryColorHover).not.toBe(result.primaryColor)
    })

    it('should make pressed color darker than base', () => {
      const result = generateCustomColors('#808080')
      // Pressed subtracts 20, so RGB values should be lower
      expect(result.primaryColorPressed).not.toBe(result.primaryColor)
    })

    it('should handle red color adjustments correctly', () => {
      const result = generateCustomColors('#ff0000')
      expect(result.primaryColor).toBe('#ff0000')
      expect(result.primaryColorHover).toBeDefined()
      expect(result.primaryColorPressed).toBeDefined()
    })

    it('should handle green color adjustments correctly', () => {
      const result = generateCustomColors('#00ff00')
      expect(result.primaryColor).toBe('#00ff00')
      expect(result.primaryColorHover).toBeDefined()
      expect(result.primaryColorPressed).toBeDefined()
    })

    it('should handle blue color adjustments correctly', () => {
      const result = generateCustomColors('#0000ff')
      expect(result.primaryColor).toBe('#0000ff')
      expect(result.primaryColorHover).toBeDefined()
      expect(result.primaryColorPressed).toBeDefined()
    })
  })

  describe('brightness clamping', () => {
    it('should clamp brightness to 255 when adding to high values', () => {
      const result = generateCustomColors('#ffff00')
      // Yellow (FF FF 00) + 20 should clamp to FF FF 14
      expect(result.primaryColorHover).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should clamp brightness to 0 when subtracting from low values', () => {
      const result = generateCustomColors('#000080')
      // Navy (00 00 80) - 20 should clamp to 00 00 60
      expect(result.primaryColorPressed).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('invalid input handling', () => {
    it('should return original color for invalid hex in adjustments', () => {
      const result = generateCustomColors('invalid')
      // Invalid hex should return original color as-is
      expect(result.primaryColor).toBe('invalid')
      expect(result.primaryColorHover).toBe('invalid')
      expect(result.primaryColorPressed).toBe('invalid')
      expect(result.primaryColorSuppl).toBe('invalid')
    })

    it('should handle hex without # prefix', () => {
      const result = generateCustomColors('ff0000')
      expect(result.primaryColor).toBe('ff0000')
      expect(result.primaryColorHover).toBeDefined()
      expect(result.primaryColorPressed).toBeDefined()
    })
  })
})
