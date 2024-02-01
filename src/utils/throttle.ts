import { useAppStore } from '~/stores'

type TimeUnit = '秒' | '分钟' | '小时'

interface Limit {
  value: number
  unit: TimeUnit
}
/**
 * 限制函数调用频率的函数。
 * @param {T} func - 需要限制调用频率的函数。
 * @param {Limit} limit - 限制调用频率的时间间隔。
 * @returns {T} - 返回一个新的函数，这个函数在指定的时间间隔内最多只会执行一次原函数。
 * @example
 * const throttledGetApiUrlTitle = limitFunctionCallFrequency(getApiUrlTitle, { value: 1, unit: '秒' });
 */
export const limitFunctionCallFrequency = <T extends (...args: any[]) => any>(func: T, limit: Limit): T => {
  const message = useMessage()
  const limitInMilliseconds = convertToMilliseconds(limit)

  return ((...args: Parameters<T>) => {
    const currentTime = new Date().getTime()
    const { lastCallTime } = useAppStore()

    if (currentTime - lastCallTime >= limitInMilliseconds) {
      func(...args)
      useAppStore().setState({ lastCallTime: currentTime })
    } else {
      const remainingTimeInMilliseconds = limitInMilliseconds - (currentTime - lastCallTime)
      const { value: remainingTime, unit } = convertFromMilliseconds(remainingTimeInMilliseconds)
      message.error(`操作过于频繁，请在${remainingTime}${unit}后再试`)
    }
  }) as T
}

/**
 * 将时间间隔转换为毫秒。
 * @param {Limit} limit - 时间间隔。
 * @returns {number} - 返回时间间隔的毫秒表示。
 */
const convertToMilliseconds = (limit: Limit): number => {
  return limit.value * getMultiplier(limit.unit)
}

/**
 * 将毫秒转换为最大的时间单位。
 * @param {number} milliseconds - 毫秒数。
 * @returns {{ value: number; unit: TimeUnit }} - 返回一个对象，包含转换后的时间值和单位。
 */
const convertFromMilliseconds = (milliseconds: number): { value: number; unit: TimeUnit } => {
  const units: TimeUnit[] = ['小时', '分钟', '秒']
  for (let i = 0; i < units.length; i++) {
    const unit = units[i]
    const value = milliseconds / getMultiplier(unit)
    if (value >= 1 || i === units.length - 1) {
      return { value: Math.ceil(value), unit }
    }
  }
  return { value: 0, unit: '秒' }
}

/**
 * 根据时间单位获取相应的乘数。
 * @param {TimeUnit} unit - 时间单位。
 * @returns {number} - 返回相应的乘数。
 */
const getMultiplier = (unit: TimeUnit): number => {
  switch (unit) {
    case '秒':
      return 1000
    case '分钟':
      return 1000 * 60
    case '小时':
      return 1000 * 60 * 60
    default:
      throw new Error(`Invalid time unit: ${unit}`)
  }
}
