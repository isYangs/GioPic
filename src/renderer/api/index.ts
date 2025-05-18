import type { SupportedUploader } from '@/main/services/beds'
import type { LskyStrategiesResponse, LskyUploadParams, ProgramDetail, ProgramType } from '@/types'
import type { Program } from '~/stores'
import { useAppStore, useProgramStore } from '~/stores'

async function callApi<T>(
  bed: SupportedUploader,
  method: string,
  args: any[] = [],
): Promise<T> {
  const res = await window.ipcRenderer.invoke('api-call', { bed, method, args })
  if (res.success)
    return res.data
  throw new Error(res.message)
}

function getCurrentProgram() {
  const appStore = useAppStore()
  const programStore = useProgramStore()
  const program = programStore.getProgram(appStore.defaultProgram)

  if (!program || !program.id) {
    throw new Error('请先选择存储程序')
  }

  return program
}

function getProgramAuthParams(program: Program): Record<string, any> {
  if (!program || !program.id) {
    throw new Error('请先选择存储程序')
  }

  if (program.type === 'lsky' || program.type === 'lskyPro') {
    const detail = program.detail as ProgramDetail['lsky']
    if (!detail.api || !detail.token) {
      throw new Error('API 地址或 Token 不能为空')
    }
    return {
      api: detail.api,
      token: detail.token,
    }
  }
  else if (program.type === 's3') {
    const detail = program.detail as ProgramDetail['s3']
    if (!detail.accessKeyId || !detail.secretAccessKey || !detail.bucketName) {
      throw new Error('AccessKey、SecretKey 或存储桶名称不能为空')
    }

    return { ...detail }
  }

  throw new Error('不支持的程序类型')
}

export const apiClient = {
  upload: async (type: ProgramType, params: Partial<LskyUploadParams>) => {
    const program = getCurrentProgram()
    const authParams = getProgramAuthParams(program)

    const completeParams: Record<string, any> = {
      ...JSON.parse(JSON.stringify(params)),
      ...JSON.parse(JSON.stringify(authParams)),
    }

    return await window.ipcRenderer.invoke('upload', { type, params: completeParams })
  },

  getStrategies: async (program?: Program) => {
    const targetProgram = program || getCurrentProgram()

    if (targetProgram.type !== 'lsky' && targetProgram.type !== 'lskyPro') {
      throw new Error('当前存储程序不支持获取存储策略')
    }

    const authParams = getProgramAuthParams(targetProgram)
    return await callApi<LskyStrategiesResponse>('lsky', 'getStrategies', [authParams])
  },
}
