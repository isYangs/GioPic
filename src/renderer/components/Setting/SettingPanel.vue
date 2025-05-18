<script setup lang="ts">
import type { SettingEntry } from '@/types'
import { useOsTheme } from 'naive-ui'
import { useAppStore } from '~/stores'
import { renderIcon } from '~/utils/main'

const props = defineProps<{
  tab?: string
}>()

const isMac = computed(() => navigator.userAgent.includes('Mac OS'))
const appStore = useAppStore()
const {
  appCloseTip,
  appCloseType,
  autoStart,
  autoUpdate,
  updateSource,
  isDevToolsEnabled,
  themeType,
  themeAuto,
} = storeToRefs(appStore)

const osThemeRef = useOsTheme()

const themeOptions = [
  { label: '浅色模式', value: 'light' },
  { label: '深色模式', value: 'dark' },
]

const closeOptions = [
  { label: '最小化到任务栏', value: 'hide' },
  { label: '直接退出', value: 'close' },
]

const updateOptions = [
  { label: 'Github', value: 'github' },
  { label: '国内源', value: 'cn' },
  { label: '自动选择', value: 'auto' },
]

// 重置确认
function confirmReset() {
  window.$dialog.warning({
    title: '重置',
    content: '重置所有设置，是否继续？',
    positiveText: '确定',
    negativeText: '取消',
    autoFocus: false,
    onPositiveClick: async () => {
      await appStore.resetState()
      window.$message.success('重置成功，部分设置在重启后生效')
    },
  })
}

// 设置面板配置
const settings: SettingEntry[] = [
  {
    title: '界面外观',
    key: 'appearance',
    icon: renderIcon('i-ph-palette-bold size-5'),
  },
  {
    title: '系统设置',
    key: 'system',
    icon: renderIcon('i-ph-sliders-horizontal-bold size-5'),
  },
  {
    title: '高级设置',
    key: 'advanced',
    icon: renderIcon('i-ph-bug-beetle-bold size-5'),
  },
  {
    title: '关于',
    key: 'about',
    icon: renderIcon('i-ph-info-bold size-5'),
  },
]

const tabIndex = settings.findIndex(i => i.key === props.tab)
const activeIndex = ref(tabIndex === -1 ? 0 : tabIndex)

// 设置标签页
const settingTabs = computed(() =>
  settings.map(({ title, icon }, index) => ({
    icon,
    key: index,
    label: () => h('a', { onClick: () => activeIndex.value = index }, title),
  })),
)

function onThemeChange(val?: boolean) {
  if (val !== undefined) {
    themeAuto.value = val
    if (val)
      themeType.value = osThemeRef.value
  }
  else {
    themeAuto.value = false
  }
}

async function onAutoStartChange(val: boolean) {
  await window.ipcRenderer.invoke('auto-start', val)
}

async function onDevToolsChange(val: boolean) {
  await window.ipcRenderer.invoke('reg-dev-tools', val)
}

watch(updateSource, (newValue) => {
  window.ipcRenderer.send('change-update-source', newValue)
})
</script>

<template>
  <div class="h-full flex">
    <n-menu
      :options="settingTabs"
      :value="activeIndex"
      class="setting-aside w-50 shrink-0 px1 pt15"
      :indent="22"
      @update:value="activeIndex = $event"
    />
    <n-scrollbar class="setting-content grow-1" content-class="p6 pt12">
      <template v-if="activeIndex === 0">
        <setting-item title="深浅模式">
          <n-select
            v-model:value="themeType"
            :options="themeOptions"
            @update-value="onThemeChange"
          />
        </setting-item>
        <setting-item title="跟随系统">
          <n-switch
            v-model:value="themeAuto"
            :round="false"
            @update-value="onThemeChange"
          />
        </setting-item>
      </template>

      <template v-else-if="activeIndex === 1">
        <setting-item title="开机自启动">
          <n-switch
            v-model:value="autoStart"
            :round="false"
            @update-value="onAutoStartChange"
          />
        </setting-item>
        <setting-item title="关闭程序时">
          <n-select
            v-model:value="appCloseType"
            :disabled="appCloseTip"
            :options="closeOptions"
          />
        </setting-item>
        <setting-item title="每次关闭程序时都询问">
          <n-switch v-model:value="appCloseTip" :round="false" />
        </setting-item>
        <setting-item title="自动检测更新" desc="在启动时检测是否有新版本">
          <n-switch v-model:value="autoUpdate" :round="false" />
        </setting-item>
        <setting-item title="更新源" desc="当无法访问Github时可切换为国内源">
          <n-select
            v-model:value="updateSource"
            :options="updateOptions"
            :style="{ width: '130px' }"
            :consistent-menu-width="false"
            size="medium"
            placement="bottom"
          />
        </setting-item>
      </template>

      <template v-else-if="activeIndex === 2">
        <setting-item title="开发者工具">
          <template #desc>
            使用快捷键
            <keycut ctrl shift>
              D
            </keycut>
            打开
          </template>
          <n-switch
            v-model:value="isDevToolsEnabled"
            :round="false"
            @update-value="onDevToolsChange"
          />
        </setting-item>
        <setting-item
          title="程序重置"
          desc="若程序显示异常或出现问题时可尝试此操作"
        >
          <n-button type="error" strong secondary @click="confirmReset">
            重置
          </n-button>
        </setting-item>
      </template>

      <template v-else-if="activeIndex === 3">
        <about />
      </template>
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
:deep(.setting-aside) {
  border-right: solid 1px var(--n-border-color);
}
:deep(.setting-content) {
  background-color: var(--n-color);
}
</style>
