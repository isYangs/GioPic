import type { programDetailTemplate } from '~/stores/program'

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

export type ProgramType = keyof typeof programDetailTemplate

export type ProgramDetail = typeof programDetailTemplate
