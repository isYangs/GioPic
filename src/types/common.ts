export interface TabOption {
  [key: string]: any
  title: string
  items: {
    name: string
    isDev?: boolean
    path?: string
    tip?: string
    width?: boolean | number
    component: () => import('vue').VNode
  }[]
  rules?: import('naive-ui').FormRules
}

export type StorageListName = 'lsky' | 'lskyPro'
