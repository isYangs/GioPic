import type { AxiosRequestConfig } from 'axios'
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

// 基础配置类型
export interface RequestConfig<T = any> extends AxiosRequestConfig {
  [key: string]: T
  showError?: boolean // 是否显示全局错误提示
}

// 扩展响应类型
export interface ResponseData<T = any> {
  code: number
  message: string
  data: T
}
