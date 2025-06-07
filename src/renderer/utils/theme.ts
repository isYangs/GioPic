const primaryColorPalette = {
  light: {
    default: '#3a7',
    blue: '#27f',
    purple: '#75e',
    orange: '#e62',
    red: '#e33',
  },
  dark: {
    default: '#7fa',
    blue: '#7bf',
    purple: '#c8f',
    orange: '#f83',
    red: '#f66',
  },
}

export type ThemeType = 'light' | 'dark' | null
export type PrimaryColorPalette = typeof primaryColorPalette.light
export type PrimaryColor = keyof PrimaryColorPalette | 'custom'

/**
 * 根据主题类型和主色调获取主色调的颜色值。
 * 特别地，当主色调为 'custom' 时，会返回一个渐变的颜色值。
 * @param themeType - 主题类型，可选值为 'light' 或 'dark'。
 * @param primaryColor - 主色调，可选值为 'default'、'blue'、'purple'、'orange' 或 'red'。
 */
export function getPrimaryColor(themeType: ThemeType, primaryColor?: keyof PrimaryColorPalette | 'custom') {
  const palette = primaryColorPalette[themeType || 'light']

  if (!themeType || !primaryColor)
    return palette.default

  if (primaryColor === 'custom')
    return `conic-gradient(${[...Object.values(palette), Object.values(palette)[0]].join(', ')})`
  else
    return primaryColorPalette[themeType][primaryColor]
}

export function generateCustomColors(baseColor: string) {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b].map((x) => {
      const hex = x.toString(16)
      return hex.length === 1 ? `0${hex}` : hex
    }).join('')}`
  }

  const adjustBrightness = (color: string, amount: number) => {
    const rgb = hexToRgb(color)
    if (!rgb)
      return color

    const adjust = (value: number) => Math.min(255, Math.max(0, Math.round(value + amount)))
    return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b))
  }

  return {
    primaryColor: baseColor,
    primaryColorHover: adjustBrightness(baseColor, 20),
    primaryColorPressed: adjustBrightness(baseColor, -20),
    primaryColorSuppl: adjustBrightness(baseColor, 20),
  }
}
