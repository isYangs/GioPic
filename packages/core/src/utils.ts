/**
 * 安全的JSON解析，不会抛出异常
 * @param text 要解析的JSON文本
 * @param defaultValue 解析失败时返回的默认值
 * @returns 解析结果或默认值
 */
export function safeJsonParse<T = any>(text: string, defaultValue: T): T {
  try {
    return JSON.parse(text) as T
  }
  catch {
    return defaultValue
  }
}

/**
 * 安全的JSON字符串化，不会抛出异常
 * @param data 要字符串化的数据
 * @param defaultValue 字符串化失败时返回的默认值
 * @returns 字符串化结果或默认值
 */
export function safeJsonStringify(data: any, defaultValue = '{}'): string {
  try {
    return JSON.stringify(data)
  }
  catch {
    return defaultValue
  }
}

/**
 * 延迟执行
 * @param ms 延迟毫秒数
 * @returns Promise对象
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 深度合并对象
 * @param target 目标对象
 * @param source 源对象
 * @returns 合并后的对象
 */
export function deepMerge<T extends object = object>(target: T, source: object): T {
  if (!source)
    return target

  const result = { ...target } as Record<string, any>

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = (source as Record<string, any>)[key]
      const targetValue = result[key]

      if (isObject(targetValue) && isObject(sourceValue)) {
        result[key] = deepMerge(targetValue, sourceValue)
      }
      else if (sourceValue !== undefined) {
        result[key] = sourceValue
      }
    }
  }

  return result as T
}

/**
 * 检查值是否为对象
 * @param value 要检查的值
 * @returns 是否为对象
 */
function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 从错误中获取错误消息
 * @param error 错误对象
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  else if (typeof error === 'string') {
    return error
  }
  else {
    try {
      return String(error)
    }
    catch {
      return 'Unknown error'
    }
  }
}
