import type { ProgramDetail } from '@/types'
import type { Program } from '~/stores'

export const safeRequest = {

  lsky(program: Program) {
    const config = program.detail as ProgramDetail['lsky']
    return {
      getStrategies: async () => {
        try {
          const data = await window.ipcRenderer.invoke('lsky:getStrategies', { config: { api: config.api, token: config.token } })

          if (!data?.strategies)
            throw new Error('获取策略列表失败')

          return data.strategies.map((item: any) => ({
            label: item.name,
            value: item.id,
          }))
        }
        catch (error) {
          console.error(error)
          throw error
        }
      },
      upload: async (file: File, permission: number = 1) => {
        const result = await window.ipcRenderer.invoke('lsky:upload', {
          config,
          data: {
            file,
            permission,
            strategy_id: config.activeStrategy,
          },
        })
        return result
      },
    }
  },

  s3(program: Program) {
    const config = program.detail as ProgramDetail['s3']
    return {
      upload: (file: File, permission: number = 1) => {
        return window.ipcRenderer.invoke('s3:upload', {
          config,
          data: {
            file,
            permission,
          },
        })
      },
    }
  },

}
