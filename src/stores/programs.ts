import requestData from '~/api'

export type ProgramType = keyof typeof programDetailTemplate

export interface Program {
  type: ProgramType
  name: string
  detail: typeof programDetailTemplate[ProgramType]
  isOk?: boolean
}

interface LskyStrategiesData {
  name: string
  id: number
}

const programDetailTemplate = {
  lsky: {
    api: '',
    token: '',
    strategies: [] as LskyStrategiesData[],
    activeStrategy: null as (number | null),
  },
  lskyPro: {
    api: '',
    token: '',
    strategies: [] as LskyStrategiesData[],
    activeStrategy: null as (number | null),
  },
  s3: {
    /** accessKeyID */
    accessKeyID: '',
    /** secretAccessKey */
    secretAccessKey: '',
    /** 存储桶名称 */
    bucketName: '',
    /** 上传路径 */
    uploadPath: '',
    /** 区域 */
    region: '',
    /** 自定义终端节点 */
    endpoint: '',
    /** 代理地址，仅支持http代理 */
    proxy: '',
    /** 自定义域名 */
    urlPrefix: '',
    /** 是否启用S3 Path Style */
    pathStyleAccess: false,
    /** 是否拒绝未经授权的SSL证书 */
    rejectUnauthorized: false,
    /** 权限 */
    acl: '',
    /** 是否禁用存储桶前缀 */
    disableBucketPrefixToURL: false,
  },
}

export const useProgramsStore = defineStore(
  'programStore',
  () => {
    const state: Program[] = reactive([])

    function createProgram(type: ProgramType) {
      state.push({
        type,
        name: Date.now().toLocaleString(),
        detail: programDetailTemplate[type],
      })
    }

    function setProgram(id: number, detail: Partial<Program>) {
      Object.assign(state[id], detail)
    }

    function getProgramName(id: number) {
      return state[id].name
    }

    function getProgram(id: number) {
      return state[id] || {}
    }

    /**
     * 获取所有的存储策略
     */
    async function getLskyStrategies(id: number): Promise<boolean> {
      const programType = state[id].type
      if (programType === 'lsky') {
        const detail = state[id].detail as typeof programDetailTemplate.lsky
        const { data, status } = await requestData.getLskyStrategies(detail.api, detail.token)

        if (status !== 200)
          return false

        const strategiesData = data.data.strategies.map((item: LskyStrategiesData) => ({
          label: item.name,
          value: item.id,
        }))

        detail.strategies = strategiesData

        if (!detail.activeStrategy && strategiesData.length > 0)
          detail.activeStrategy = strategiesData[0].value

        return true
      }
      else if (programType === 'lskyPro') {
        const detail = state[id].detail as typeof programDetailTemplate.lskyPro
        const { data, status } = await requestData.getLskyStrategies(detail.api, detail.token)

        if (status !== 200)
          return false

        const strategiesData = data.data.strategies.map((item: LskyStrategiesData) => ({
          label: item.name,
          value: item.id,
        }))

        detail.strategies = strategiesData

        if (!detail.activeStrategy && strategiesData.length > 0)
          detail.activeStrategy = strategiesData[0].value
        return true
      }
      else {
        return false
      }
    }

    return {
      ...toRefs(state),
      createProgram,
      setProgram,
      getProgram,
      getProgramName,
      getLskyStrategies,
    }
  },
  {
    persistedState: {
      key: '__giopic_programs_store__',
      includePaths: ['programs'],
    },
  },
)
