import { vi } from 'vitest'
import { convertFileSize, generateLink, getLinkType, getLinkTypeOptions } from '~/utils/main'

describe('convertFileSize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty/null input', () => {
    it('should return empty string for undefined', () => {
      const result = convertFileSize(undefined)
      expect(result).toBe('')
    })

    it('should return empty string for 0', () => {
      const result = convertFileSize(0)
      expect(result).toBe('')
    })
  })

  describe('bytes', () => {
    it('should return bytes for 500', () => {
      const result = convertFileSize(500)
      expect(result).toBe('500 B')
    })

    it('should return bytes for 1', () => {
      const result = convertFileSize(1)
      expect(result).toBe('1 B')
    })

    it('should return bytes for 1023', () => {
      const result = convertFileSize(1023)
      expect(result).toBe('1023 B')
    })
  })

  describe('kilobytes', () => {
    it('should return KB for 1024', () => {
      const result = convertFileSize(1024)
      expect(result).toBe('1.00 KB')
    })

    it('should return KB for 1536', () => {
      const result = convertFileSize(1536)
      expect(result).toBe('1.50 KB')
    })

    it('should return KB for 2048', () => {
      const result = convertFileSize(2048)
      expect(result).toBe('2.00 KB')
    })

    it('should handle KB with proper decimal places', () => {
      const result = convertFileSize(1234)
      expect(result).toMatch(/^\d+\.\d{2} KB$/)
    })
  })

  describe('megabytes', () => {
    it('should return MB for 1048576', () => {
      const result = convertFileSize(1048576)
      expect(result).toBe('1.00 MB')
    })

    it('should return MB for 5242880', () => {
      const result = convertFileSize(5242880)
      expect(result).toBe('5.00 MB')
    })

    it('should handle MB with proper decimal places', () => {
      const result = convertFileSize(1500000)
      expect(result).toMatch(/^\d+\.\d{2} MB$/)
    })
  })

  describe('gigabytes', () => {
    it('should return GB for 1073741824', () => {
      const result = convertFileSize(1073741824)
      expect(result).toBe('1.00 GB')
    })

    it('should return GB for 5368709120', () => {
      const result = convertFileSize(5368709120)
      expect(result).toBe('5.00 GB')
    })

    it('should handle GB with proper decimal places', () => {
      const result = convertFileSize(1500000000)
      expect(result).toMatch(/^\d+\.\d{2} GB$/)
    })
  })
})

describe('getLinkType', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return URL for url', () => {
    const result = getLinkType('url')
    expect(result).toBe('URL')
  })

  it('should return HTML for html', () => {
    const result = getLinkType('html')
    expect(result).toBe('HTML')
  })

  it('should return BBcode for bbcode', () => {
    const result = getLinkType('bbcode')
    expect(result).toBe('BBcode')
  })

  it('should return Markdown for markdown', () => {
    const result = getLinkType('markdown')
    expect(result).toBe('Markdown')
  })

  it('should return Markdown With Link for markdown_with_link', () => {
    const result = getLinkType('markdown_with_link')
    expect(result).toBe('Markdown With Link')
  })

  it('should return the input string for unknown type', () => {
    const result = getLinkType('unknown')
    expect(result).toBe('unknown')
  })

  it('should return the input string for custom type', () => {
    const result = getLinkType('custom_format')
    expect(result).toBe('custom_format')
  })
})

describe('getLinkTypeOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return array of options', () => {
    const result = getLinkTypeOptions()
    expect(Array.isArray(result)).toBe(true)
  })

  it('should return 5 options', () => {
    const result = getLinkTypeOptions()
    expect(result).toHaveLength(5)
  })

  it('should have label, value, and key properties in each option', () => {
    const result = getLinkTypeOptions()
    result.forEach((option) => {
      expect(option).toHaveProperty('label')
      expect(option).toHaveProperty('value')
      expect(option).toHaveProperty('key')
    })
  })

  it('should have value equal to key', () => {
    const result = getLinkTypeOptions()
    result.forEach((option) => {
      expect(option.value).toBe(option.key)
    })
  })

  it('should have first option as url', () => {
    const result = getLinkTypeOptions()
    const urlOption = result.find(opt => opt.value === 'url')
    expect(urlOption).toEqual({ label: 'URL', value: 'url', key: 'url' })
  })

  it('should have html option', () => {
    const result = getLinkTypeOptions()
    const htmlOption = result.find(opt => opt.value === 'html')
    expect(htmlOption).toEqual({ label: 'HTML', value: 'html', key: 'html' })
  })

  it('should have bbcode option', () => {
    const result = getLinkTypeOptions()
    const bbcodeOption = result.find(opt => opt.value === 'bbcode')
    expect(bbcodeOption).toEqual({ label: 'BBcode', value: 'bbcode', key: 'bbcode' })
  })

  it('should have markdown option', () => {
    const result = getLinkTypeOptions()
    const markdownOption = result.find(opt => opt.value === 'markdown')
    expect(markdownOption).toEqual({ label: 'Markdown', value: 'markdown', key: 'markdown' })
  })

  it('should have markdown_with_link option', () => {
    const result = getLinkTypeOptions()
    const mdWithLinkOption = result.find(opt => opt.value === 'markdown_with_link')
    expect(mdWithLinkOption).toEqual({ label: 'Markdown With Link', value: 'markdown_with_link', key: 'markdown_with_link' })
  })
})

describe('generateLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('html format', () => {
    it('should generate HTML img tag', () => {
      const result = generateLink('html', 'http://img.png', 'test')
      expect(result).toBe('<img src="http://img.png" alt="test" title="test" />')
    })

    it('should handle special characters in name', () => {
      const result = generateLink('html', 'http://example.com/img.png', 'test "quoted"')
      expect(result).toContain('alt="test "quoted""')
    })

    it('should handle URL with query parameters', () => {
      const result = generateLink('html', 'http://example.com/img.png?size=large', 'photo')
      expect(result).toContain('http://example.com/img.png?size=large')
    })
  })

  describe('bbcode format', () => {
    it('should generate BBcode img tag', () => {
      const result = generateLink('bbcode', 'http://img.png', 'test')
      expect(result).toBe('[img]http://img.png[/img]')
    })

    it('should ignore name parameter in bbcode', () => {
      const result1 = generateLink('bbcode', 'http://img.png', 'name1')
      const result2 = generateLink('bbcode', 'http://img.png', 'name2')
      expect(result1).toBe(result2)
    })

    it('should handle URL with special characters', () => {
      const result = generateLink('bbcode', 'http://example.com/img-2024.png', 'photo')
      expect(result).toBe('[img]http://example.com/img-2024.png[/img]')
    })
  })

  describe('markdown format', () => {
    it('should generate Markdown image syntax', () => {
      const result = generateLink('markdown', 'http://img.png', 'test')
      expect(result).toBe('![test](http://img.png)')
    })

    it('should handle special characters in name', () => {
      const result = generateLink('markdown', 'http://img.png', 'my [image] here')
      expect(result).toBe('![my [image] here](http://img.png)')
    })

    it('should handle markdown with brackets in URL', () => {
      const result = generateLink('markdown', 'http://example.com/[special].png', 'photo')
      expect(result).toBe('![photo](http://example.com/[special].png)')
    })
  })

  describe('markdown_with_link format', () => {
    it('should generate Markdown with link syntax', () => {
      const result = generateLink('markdown_with_link', 'http://img.png', 'test')
      expect(result).toBe('[![test](http://img.png)](http://img.png)')
    })

    it('should wrap markdown image in link', () => {
      const result = generateLink('markdown_with_link', 'http://example.com/img.png', 'photo')
      expect(result).toBe('[![photo](http://example.com/img.png)](http://example.com/img.png)')
    })

    it('should have same URL for image and link', () => {
      const url = 'http://example.com/image-2024.png'
      const result = generateLink('markdown_with_link', url, 'image')
      expect(result).toBe(`[![image](${url})](${url})`)
    })
  })

  describe('url format and unknown format', () => {
    it('should return raw URL for url type', () => {
      const url = 'http://img.png'
      const result = generateLink('url', url, 'test')
      expect(result).toBe(url)
    })

    it('should ignore name parameter for url type', () => {
      const url = 'http://img.png'
      const result1 = generateLink('url', url, 'name1')
      const result2 = generateLink('url', url, 'name2')
      expect(result1).toBe(result2)
    })

    it('should return raw URL for unknown format', () => {
      const url = 'http://img.png'
      const result = generateLink('unknown_format', url, 'test')
      expect(result).toBe(url)
    })

    it('should return raw URL for empty format', () => {
      const url = 'http://img.png'
      const result = generateLink('', url, 'test')
      expect(result).toBe(url)
    })
  })

  describe('edge cases', () => {
    it('should handle empty name', () => {
      const result = generateLink('html', 'http://img.png', '')
      expect(result).toContain('alt=""')
    })

    it('should handle very long URL', () => {
      const longUrl = `http://example.com/${'a'.repeat(500)}.png`
      const result = generateLink('html', longUrl, 'test')
      expect(result).toContain(longUrl)
    })

    it('should handle URL with hash', () => {
      const url = 'http://example.com/img.png#anchor'
      const result = generateLink('markdown', url, 'photo')
      expect(result).toBe(`![photo](${url})`)
    })
  })
})
