import type { Router } from 'vue-router'
import SettingPanel from '~/components/Setting/SettingPanel.vue'

interface LinkTypeMap { [key: string]: string }

// 渲染图标
export function renderIcon(icon: string) {
  return () => h('div', { class: `${icon}` })
}

// 将文件大小从字节或千字节转换为 KB、MB 或 GB
export function convertFileSize(size: number, isKb: boolean = false) {
  const units = ['Bytes', 'kiB', 'MiB', 'GiB']
  if (isKb)
    size *= 1024
  if (size < 1024)
    return `${size} ${units[0]}`
  const unitIndex = Math.floor(Math.log(size) / Math.log(1024))
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const linkTypeMap: LinkTypeMap = {
  url: 'URL',
  html: 'HTML',
  bbcode: 'BBcode',
  markdown: 'Markdown',
  markdown_with_link: 'Markdown With Link',
  thumbnail_url: 'Thumbnail URL',
}

// 获取格式化后的链接类型，用于显示
export function getLinkType(linkType: string) {
  return linkTypeMap[linkType] || linkType
}

// 获取链接类型选项
export function getLinkTypeOptions() {
  return Object.entries(linkTypeMap).map(([value, label]) => ({ label, value, key: value }))
}

// 生成链接
export function generateLink(type: string, url: string, name: string): string {
  switch (type) {
    case 'html':
      return `<img src="${url}" alt="${name}" title="${name}" />`
    case 'bbcode':
      return `[img]${url}[/img]`
    case 'markdown':
      return `![${name}](${url})`
    case 'markdown_with_link':
      return `[![${name}](${url})](${url})`
    default:
      return url
  }
}

// 全局路由跳转
export function routerPush(router: Router) {
  window.ipcRenderer.on('open-setting', () =>
    createSettingPanel())
  window.ipcRenderer.on('open-about', () =>
    router?.push('/About'))
}

export function createSettingPanel() {
  window.$modal.create({
    autoFocus: false,
    bordered: false,
    closeOnEsc: false,
    title: '设置',
    content: () => h(SettingPanel),
    maskClosable: false,
    preset: 'card',
    transformOrigin: 'center',
    class: 'setting-panel',
  })
}
