<script setup lang="ts">
import { NButton, NSelect, NSwitch, useOsTheme } from 'naive-ui'
import Keycut from '~/components/Common/Keycut.vue'
import type { SettingEntry, TabOption } from '~/types'
import About from './About.vue'
import SettingSection from './SettingSection.vue'

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

const activeIndex = ref(0)

const uiOptions: TabOption[] = [{
  title: '主题颜色',
  items: [{
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
  }, {
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
  }],
}]

const systemOptions: TabOption[] = [{
  title: '启动和关闭',
  items: [{
    name: '是否开机自启动',
    component: () => h(NSwitch, {
      value: autoStart.value,
      round: false,
      onUpdateValue: (val: boolean) => {
        autoStart.value = val
        window.ipcRenderer.invoke('auto-start', val)
      },
    }),
  }, {
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
  }, {
    name: '每次关闭程序时都询问',
    component: () => h(NSwitch, {
      value: appCloseTip.value,
      round: false,
      onUpdateValue: (val: boolean) => appCloseTip.value = val,
    }),
  }, {
    name: '自动检测更新',
    tip: '在启动时检测是否有新版本',
    component: () => h(NSwitch, {
      value: autoUpdate.value,
      round: false,
      onUpdateValue: (val: boolean) => autoUpdate.value = val,
    }),
  }],
}]

const devOptions: TabOption[] = [{
  title: '开发调试',
  items: [{
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
  }, {
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
  }],
}]

function renderSetting(options: TabOption[]) {
  return () => h('ul', options.map(({ title, items }) =>
    h(SettingSection, {
      key: title,
      title,
      items,
    }),
  ))
}

const settings: SettingEntry[] = [{
  title: '界面外观',
  icon: renderIcon('i-ph-palette-bold size-5'),
  comp: renderSetting(uiOptions),
}, {
  title: '系统设置',
  icon: renderIcon('i-ph-sliders-horizontal-bold size-5'),
  comp: renderSetting(systemOptions),
}, {
  title: '高级设置',
  icon: renderIcon('i-ph-bug-beetle-bold size-5'),
  comp: renderSetting(devOptions),
}, {
  title: '关于',
  icon: renderIcon('i-ph-info-bold size-5'),
  comp: () => h(About),
}]

const settingTabs = computed(() =>
  settings.map(({ title, icon }, index) => ({
    icon,
    key: index,
    label: () => h('a', {
      onClick: () => activeIndex.value = index,
    }, title),
  })),
)
</script>

<template>
  <div class="h-full flex" style="display: flex">
    <n-menu
      :options="settingTabs"
      :value="activeIndex"
      class="setting-aside w-50 shrink-0 px1 pt15"
      :indent="22"
      @update:value="activeIndex = $event"
    />
    <n-scrollbar class="setting-content grow-1" content-class="p6 pt10">
      <component :is="settings[activeIndex].comp" :key="activeIndex" />
    </n-scrollbar>
  </div>
</template>

<style>
.setting-panel[class] {
  --uno: p0 w80vw max-w-1024px h80vh max-h-720px overflow-hidden;
}
.setting-panel > .n-card-header {
  --uno: absolute left-0 right-0 z-1 text-4 py4;
}
.setting-panel > .n-card__content {
  --uno: p0 h-full;
}
</style>

<style scoped>
.setting-tab:hover {
  background-color: var(--n-item-text-color-hover);
}
.setting-tab.active {
  background-color: var(--n-item-text-color-active);
}
:deep(.setting-aside) {
  border-right: solid 1px var(--n-border-color);
}
:deep(.setting-content) {
  background-color: var(--n-color);
}
</style>
