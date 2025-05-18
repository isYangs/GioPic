/**
 * 防抖函数
 * @param {Function} func - 要进行防抖处理的函数
 * @param {number} delay - 延迟时间，单位毫秒
 * @returns {Function} - 返回一个新的函数，该函数在指定的时间间隔内最多只会执行一次
 */
function debounce(func: (...args: any[]) => void, delay: number): (...args: any[]) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: any[]) {
    if (timerId)
      clearTimeout(timerId)

    timerId = setTimeout(() => {
      timerId = null // 清除定时器ID
      func.apply(this, args)
    }, delay)
  }
}

export default debounce
