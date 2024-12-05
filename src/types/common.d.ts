export interface TabOption {
  title?: string
  icon?: () => import('vue').VNode
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
