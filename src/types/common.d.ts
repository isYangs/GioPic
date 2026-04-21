export interface TabOption {
  title?: string
  items: {
    name: string
    isDev?: boolean
    path?: string
    tip?: string | (() => import('vue').VNode)
    width?: boolean | number
    component: () => import('vue').VNode
  }[]
  rules?: import('naive-ui').FormRules
}

export interface SettingEntry {
  title?: string
  key: string
  icon?: () => import('vue').VNode
}

export interface NpmSearchResult {
  name: string
  version: string
  description: string
  author?: {
    name: string
  }
  date: string
  keywords?: string[]
  homepage?: string
  downloadCount?: number
  recommendScore?: number
}
