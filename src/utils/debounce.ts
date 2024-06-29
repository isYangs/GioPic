/**
 * 防抖函数
 * @param {Function} func - 要进行防抖处理的函数
 * @param {number} delay - 延迟时间，单位毫秒
 * @param {string} errorMessage - 重复触发时的提醒消息
 * @returns {Function} - 返回一个新的函数，该函数在指定的时间间隔内最多只会执行一次
 */

function debounce(
  func: (...args: any[]) => void,
  delay: number,
  errorMessage?: string,
): (...args: any[]) => void {
  let timerId: ReturnType<typeof setTimeout>
  let lastCallTime: number = 0

  return (...args: any[]) => {
    const currentTime = Date.now()
    const elapsed = currentTime - lastCallTime

    if (elapsed < delay && errorMessage) {
      window.$message.warning(errorMessage)
      return
    }

    clearTimeout(timerId)
    timerId = setTimeout(() => {
      func(...args)
      lastCallTime = Date.now()
    }, delay)
  }
}

export default debounce
