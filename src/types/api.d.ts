/**
 * 兰空图床v1 API必传参数
 */
export type LskyOptions = Omit<ProgramDetail['lsky'], 'strategies' | 'activeStrategy'>

export interface LskyStrategiesResponse {
  strategies: {
    id: number
    name: string
  }[]
}
