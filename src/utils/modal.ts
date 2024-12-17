import CreateProgram from '~/components/Setting/CreateProgram.vue'
import SettingPanel from '~/components/Setting/SettingPanel.vue'
import UpdateAvailable from '~/components/Update/UpdateAvailable.vue'
import UpdateRestart from '~/components/Update/UpdateRestart.vue'
import { useUniqueModal } from '~/composables/useModal'

// 打开设置面板
export function openCreateSettingPanel() {
  useUniqueModal('设置', SettingPanel, {
    class: 'setting-panel',
  })
}

// 打开创建存储类型面板
export function openCreateProgram() {
  useUniqueModal('创建存储', CreateProgram)
}

// 打开新版本更新提示
export function openUpdateAvailable(releaseVersion: string, releaseContent: string) {
  useUniqueModal(`新版本：${releaseVersion}`, {
    comp: UpdateAvailable,
    props: {
      releaseVersion,
      releaseContent,
    },
  }, { closable: false })
}

// 打开更新下载完成提示
export function openUpdateRestart(forceUpdate: boolean) {
  useUniqueModal('更新下载完成', {
    comp: UpdateRestart,
    props: {
      forceUpdate,
    },
  }, { closable: false })
}
