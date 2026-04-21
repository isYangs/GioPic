/**
 * 调用主进程方法
 * @param channel 通道名称
 * @param data 传递的数据
 * @returns Promise<T> 返回的数据
 */
export async function callIpc<T = any, P = any>(channel: string, data?: P): Promise<T> {
  try {
    const result = await window.ipcRenderer.callMain(channel, data)
    return result as T
  }
  catch (error) {
    // 将错误重新抛出，由调用方处理
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`IPC调用失败: ${channel}`)
  }
}
