import requestData from '~/api'

export type ProgramType = keyof typeof initialProgramMap

interface Program {
  type: ProgramType
  name: string
  datail: typeof initialProgramMap[ProgramType]
  isOk?: boolean
}

interface LskyStrategiesData {
  name: string
  id: number
}

// 同时定义 State 类型和初始值
const initialProgramMap = {
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
    const state = reactive<Program[]>([])

    function createProgram(type: ProgramType) {
      state.push({
        type,
        name: Date.now().toLocaleString(),
        datail: initialProgramMap[type],
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
      if (!programType.includes('lsky'))
        return false

      const lskyDetail = state[id].datail as typeof initialProgramMap.lsky
      const requestDataFunction = requestData.getLskyStrategies

      const { data, status } = await requestDataFunction(lskyDetail.api, lskyDetail.token)

      if (status !== 200)
        return false

      const strategiesData = data.data.strategies.map((item: LskyStrategiesData) => ({
        label: item.name,
        value: item.id,
      }))

      lskyDetail.strategies = strategiesData
      if (lskyDetail.activeStrategy === null && strategiesData.length > 0)
        lskyDetail.activeStrategy = strategiesData[0].value
      return true
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
