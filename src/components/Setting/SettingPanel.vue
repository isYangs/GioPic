<script setup lang="ts">
import { NButton, NSelect, NSwitch, useOsTheme } from 'naive-ui'
import Keycut from '~/components/Common/Keycut.vue'
import type { TabOption } from '~/types'

const appStore = useAppStore()
const {
  appCloseTip,
  appCloseType,
  autoStart,
  autoUpdate,
  isDevToolsEnabled,
  themeType,
  themeAuto,
} = storeToRefs(appStore)

const osThemeRef = useOsTheme()

const setTabsVal = ref('setTab1')
const isUserScroll = ref(false)

const settings = ref<TabOption[]>([
  {
    title: '常规',
    items: [
      {
        name: '深浅模式',
        component: () => h(NSelect, {
          value: themeType.value,
          onUpdateValue: (val: 'dark' | 'light') => {
            themeAuto.value = false
            themeType.value = val
          },
          options: [
            { label: '浅色模式', value: 'light' },
            { label: '深色模式', value: 'dark' },
          ],
        }),
      },
      {
        name: '深浅模式是否跟随系统',
        component: () => h(NSwitch, {
          value: themeAuto.value,
          round: false,
          onUpdateValue: (val: boolean) => {
            themeAuto.value = val
            if (val)
              themeType.value = osThemeRef.value
          },
        }),
      },
    ],
  },
  {
    title: '系统',
    items: [
      {
        name: '是否开机自启动',
        component: () => h(NSwitch, {
          value: autoStart.value,
          round: false,
          onUpdateValue: (val: boolean) => {
            autoStart.value = val
            window.ipcRenderer.invoke('auto-start', val)
          },
        }),
      },
      {
        name: '关闭程序时',
        component: () => h(NSelect, {
          value: appCloseType.value,
          disabled: appCloseTip.value,
          onUpdateValue: (val: 'hide' | 'close') => appCloseType.value = val,
          options: [
            { label: '最小化到任务栏', value: 'hide' },
            { label: '直接退出', value: 'close' },
          ],
        }),
      },
      {
        name: '每次关闭程序时都询问',
        component: () => h(NSwitch, {
          value: appCloseTip.value,
          round: false,
          onUpdateValue: (val: boolean) => appCloseTip.value = val,
        }),
      },
      {
        name: '自动检测更新',
        tip: '在启动时检测是否有新版本',
        component: () => h(NSwitch, {
          value: autoUpdate.value,
          round: false,
          onUpdateValue: (val: boolean) => autoUpdate.value = val,
        }),
      },
    ],
  },
  {
    title: '其他',
    items: [
      {
        name: '开发者工具',
        tip: () => h('span', ['开启后可使用', h(Keycut, { ctrl: true, shift: true }, () => 'D'), '打开开发者工具']),
        component: () => h(NSwitch, {
          value: isDevToolsEnabled.value,
          round: false,
          onUpdateValue: (val: boolean) => {
            isDevToolsEnabled.value = val
            window.ipcRenderer.invoke('reg-dev-tools', val)
          },
        }),
      },
      {
        name: '程序重置',
        tip: '若程序显示异常或出现问题时可尝试此操作',
        component: () => h(NButton, {
          type: 'error',
          strong: true,
          secondary: true,
          onClick: () => {
            window.$dialog.warning({
              title: '重置',
              content: '重置所有设置，是否继续？',
              positiveText: '确定',
              negativeText: '取消',
              autoFocus: false,
              onPositiveClick: async () => {
                await appStore.resetState()
                // 显示重置成功提示
                window.$message.success('重置成功，部分设置在重启后生效')
              },
            })
          },
        }, () => '重置'),
      },
    ],
  },
])
</script>

<template>
  <div class="h-full flex">
    <n-scrollbar class="w-40 shrink-0">
      1
    </n-scrollbar>
    <n-scrollbar class="h80vh grow-1">
      <SettingSection
        v-for="tab in settings"
        :key="tab.title"
        class="scroll-mt-10"
        :title="tab.title"
        :items="tab.items"
      />
    </n-scrollbar>
  </div>
</template>

<style>
.setting-panel {
  --uno: p0 w90% max-w-1024px h90vh max-h-720px;
}
.setting-panel > .n-card-header {
  --uno: absolute right-0 z-1;
}
.setting-panel > .n-card__content {
  --uno: p0;
}
</style>

<style scoped>
</style>
