export interface TabOption {
  title: string
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

export type ProgramsName = 'lsky' | 'lskyPro'
