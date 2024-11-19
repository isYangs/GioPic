import requestData from '~/api'

export type ProgramType = keyof typeof programDetailTemplate

export interface Program {
  type: ProgramType
  name: string
  id: number
  detail: typeof programDetailTemplate[ProgramType]
  isOk?: boolean
}

interface LskyStrategiesData {
  name: string
  id: number
}

const programTypeName: Record<ProgramType, string> = {
  lsky: '兰空图床社区版',
  lskyPro: '兰空图床企业版V1',
  s3: 'S3(AWS/腾讯云/阿里云)',
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

export const useProgramStore = defineStore(
  'programStore',
  () => {
    const state: Program[] = reactive([])

    function createProgram() {
      const id = Date.now()
      state.push({
        type: 'lsky',
        name: `新建存储 ${state.length + 1}`,
        id,
        detail: programDetailTemplate.lsky,
      })
      return id
    }

    function initProgram(id: number, type: ProgramType) {
      Object.assign(getProgram(id), {
        type,
        detail: programDetailTemplate[type],
      })
    }

    function setProgram(id: number, detail: Partial<Program>) {
      Object.assign(getProgram(id), detail)
    }

    function renameProgram(id: number, name: string) {
      getProgram(id).name = name
    }

    function getProgramTypeList() {
      return Object.entries(programTypeName).map(([key, value]) => ({
        label: value,
        value: key as ProgramType,
      }))
    }

    function getProgram(id: number): Program {
      const program = state.find(item => item.id === id)
      if (!program) {
        return {
          type: 'lsky',
          name: '未知存储',
          id,
          detail: programDetailTemplate.lsky,
        }
      }
      return program
    }

    function getProgramList() {
      return state.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
      }))
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
      initProgram,
      setProgram,
      renameProgram,
      getProgramTypeList,
      getProgramList,
      getProgram,
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
