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
    const programs = ref<Program[]>([])

    function createProgram() {
      const id = Date.now()
      programs.value.push({
        type: 'lsky',
        name: '',
        id,
        detail: programDetailTemplate.lsky,
      })
      return id
    }

    function setProgramType(id: number, type: ProgramType) {
      Object.assign(getProgram(id), {
        type,
        detail: programDetailTemplate[type],
      })
    }

    function setProgram(id: number, detail: Partial<Program>) {
      Object.assign(getProgram(id), detail)
    }

    function setProgramName(id: number, name: string) {
      getProgram(id).name = name
    }

    function getProgramTypeList() {
      return Object.entries(programTypeName).map(([key, value]) => ({
        label: value,
        value: key as ProgramType,
      }))
    }

    function getProgram(id: number): Program {
      const program = programs.value.find(item => item.id === id)
      // 防止开发过程中异常路由导致程序崩溃
      if (!program) {
        return { type: 'lsky', name: '', id, detail: programDetailTemplate.lsky }
      }
      return program
    }

    function getProgramList() {
      return programs.value.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
      }))
    }

    function indexOf(id: number) {
      return programs.value.findIndex(item => item.id === id)
    }

    function removeProgram(id: number) {
      const index = indexOf(id)
      if (index !== -1)
        programs.value.splice(index, 1)
    }

    /**
     * 获取所有的存储策略
     */
    async function getLskyStrategies(id: number): Promise<boolean> {
      const programType = programs.value[id].type
      if (programType === 'lsky') {
        const detail = programs.value[id].detail as typeof programDetailTemplate.lsky
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
        const detail = programs.value[id].detail as typeof programDetailTemplate.lskyPro
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
      programs,
      createProgram,
      setProgramType,
      setProgram,
      setProgramName,
      getProgramTypeList,
      getProgramList,
      indexOf,
      getProgram,
      removeProgram,
      getLskyStrategies,
    }
  },
  {
    persistedState: {
      key: '__giopic_program_store__',
      includePaths: ['programs'],
    },
  },
)
