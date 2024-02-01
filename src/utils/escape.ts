/**
 * 将 HTML 实体转换回它们对应的字符。
 *
 * @param {string} safe - 包含 HTML 实体的字符串。
 * @returns {string} - 转换后的字符串，其中的 HTML 实体已被替换为对应的字符。
 */
export function unescapeHtml(safe: string): string {
  return safe
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, '\'')
}
