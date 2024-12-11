import CreateProgram from '~/components/Setting/CreateProgram.vue'
import SettingPanel from '~/components/Setting/SettingPanel.vue'
import UpdateAvailable from '~/components/Update/UpdateAvailable.vue'
import UpdateRestart from '~/components/Update/UpdateRestart.vue'

// 打开设置面板
export function openCreateSettingPanel() {
  window.$modal.create({
    autoFocus: false,
    bordered: false,
    closeOnEsc: false,
    title: '设置',
    maskClosable: false,
    preset: 'card',
    transformOrigin: 'center',
    class: 'setting-panel',
    content: () => h(SettingPanel),
  })
}

// 打开创建存储类型面板
export function openCreateProgram() {
  const modal = window.$modal.create({
    title: '创建存储',
    autoFocus: false,
    bordered: false,
    closeOnEsc: false,
    maskClosable: false,
    preset: 'card',
    transformOrigin: 'center',
    content: () => h(CreateProgram, { onClose: () => modal.destroy() }),
  })
}

// 打开新版本更新提示
export function openUpdateAvailable(releaseVersion: string, releaseContent: string) {
  const modal = window.$modal.create({
    title: `新版本：${releaseVersion}`,
    autoFocus: false,
    bordered: false,
    closeOnEsc: false,
    maskClosable: false,
    closable: false,
    preset: 'card',
    transformOrigin: 'center',
    content: () => h(UpdateAvailable, {
      releaseVersion,
      releaseContent,
      onClose: () => modal.destroy(),
    }),
  })
}

// 打开更新下载完成提示
export function openUpdateRestart(forceUpdate: boolean) {
  const modal = window.$modal.create({
    title: '更新下载完成',
    autoFocus: false,
    bordered: false,
    closeOnEsc: false,
    maskClosable: false,
    closable: false,
    preset: 'card',
    transformOrigin: 'center',
    content: () => h(UpdateRestart, { forceUpdate, onClose: () => modal.destroy() }),
  })
}
