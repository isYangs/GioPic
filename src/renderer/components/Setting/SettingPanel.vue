<script setup lang="ts">
import type { InputInst, SelectOption } from 'naive-ui'
import type { VNodeChild } from 'vue'
import type { SettingEntry } from '@/types'
import { useOsTheme } from 'naive-ui'

const props = defineProps<{
  tab?: string
}>()

const appStore = useAppStore()
const {
  appCloseTip,
  appCloseType,
  autoStart,
  autoUpdate,
  showDockIcon,
  updateSource,
  isDevToolsEnabled,
  themeType,
  themeAuto,
  npmRegistry,
  customNpmRegistry,
  sidebarWidth,
  borderRadius,
  enableAnimations,
  primaryColor,
  customPrimaryColor,
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
  { label: 'GitHub', value: 'github' },
  { label: '国内源', value: 'cn' },
  { label: '自动选择', value: 'auto' },
]

const npmRegistryOptions = [
  { label: '自动选择', value: 'auto' },
  { label: '淘宝镜像', value: 'taobao' },
  { label: '腾讯镜像', value: 'tencent' },
  { label: 'npm 官方', value: 'npm' },
  { label: '自定义', value: 'custom' },
]

const sidebarWidthOptions = [
  { label: '紧凑 (160px)', value: 160 },
  { label: '标准 (180px)', value: 180 },
  { label: '宽松 (220px)', value: 220 },
]

const borderRadiusOptions = [
  { label: '方正 (4px)', value: 4 },
  { label: '默认 (8px)', value: 8 },
  { label: '圆润 (12px)', value: 12 },
  { label: '更圆 (16px)', value: 16 },
]

const primaryColorOptions = [
  { label: '默认', value: 'default' },
  { label: '蓝色', value: 'blue' },
  { label: '紫色', value: 'purple' },
  { label: '橙色', value: 'orange' },
  { label: '红色', value: 'red' },
  { label: '自定义', value: 'custom' },
]

type DynamicSelectKey = 'updateSource' | 'npmRegistry'
type DynamicSelectPlacement = 'top-start' | 'bottom-start'

const floatingSelectProps = {
  consistentMenuWidth: false,
  to: 'body',
} as const

const updateSourceTriggerRef = ref<HTMLElement | null>(null)
const npmRegistryTriggerRef = ref<HTMLElement | null>(null)

const dynamicSelectPlacements = reactive<Record<DynamicSelectKey, DynamicSelectPlacement>>({
  updateSource: 'bottom-start',
  npmRegistry: 'bottom-start',
})

const dynamicSelectShows = reactive<Record<DynamicSelectKey, boolean>>({
  updateSource: false,
  npmRegistry: false,
})

const dynamicSelectMenuHeights = reactive<Record<DynamicSelectKey, number>>({
  updateSource: 0,
  npmRegistry: 0,
})

const customRegistryFieldRef = ref<HTMLElement | null>(null)
const customRegistryInputRef = ref<InputInst | null>(null)

function estimateMenuHeight(optionCount: number) {
  const optionHeight = 34
  const menuVerticalPadding = 18
  return optionCount * optionHeight + menuVerticalPadding
}

function resolvePlacementBoundary(triggerEl: HTMLElement) {
  const settingPanel = triggerEl.closest('.setting-panel')
  const scrollViewport = settingPanel?.querySelector('.setting-content .n-scrollbar-container')
  const scrollArea = settingPanel?.querySelector('.setting-content')

  if (scrollViewport instanceof HTMLElement)
    return scrollViewport.getBoundingClientRect()

  if (scrollArea instanceof HTMLElement)
    return scrollArea.getBoundingClientRect()

  if (settingPanel instanceof HTMLElement)
    return settingPanel.getBoundingClientRect()

  return new DOMRect(0, 0, window.innerWidth, window.innerHeight)
}

function updateDynamicSelectPlacement(key: DynamicSelectKey, triggerEl: HTMLElement, optionCount: number) {
  const boundaryRect = resolvePlacementBoundary(triggerEl)
  const triggerRect = triggerEl.getBoundingClientRect()
  const estimatedHeight = estimateMenuHeight(optionCount)
  const safeGap = 12
  const availableBelow = Math.max(boundaryRect.bottom - triggerRect.bottom - safeGap, 0)
  const availableAbove = Math.max(triggerRect.top - boundaryRect.top - safeGap, 0)
  const shouldOpenBelow = availableBelow >= estimatedHeight || availableBelow >= availableAbove
  const availableSpace = shouldOpenBelow ? availableBelow : availableAbove

  dynamicSelectPlacements[key] = shouldOpenBelow ? 'bottom-start' : 'top-start'
  dynamicSelectMenuHeights[key] = Math.min(Math.floor(availableSpace), estimatedHeight)
}

function getDynamicSelectTrigger(key: DynamicSelectKey) {
  const triggerRef = key === 'updateSource'
    ? updateSourceTriggerRef.value
    : npmRegistryTriggerRef.value

  if (!triggerRef)
    return

  const selectionTrigger = triggerRef.querySelector('.n-base-selection')

  if (selectionTrigger instanceof HTMLElement)
    return selectionTrigger

  return triggerRef
}

function updateDynamicSelectLayout(key: DynamicSelectKey, optionCount: number) {
  const triggerEl = getDynamicSelectTrigger(key)

  if (!triggerEl)
    return

  updateDynamicSelectPlacement(key, triggerEl, optionCount)
}

function getDynamicSelectMenuProps(key: DynamicSelectKey) {
  return {
    style: {
      '--n-height': `${dynamicSelectMenuHeights[key]}px`,
    },
  }
}

function onDynamicSelectShowChange(key: DynamicSelectKey, show: boolean, optionCount: number) {
  if (!show) {
    dynamicSelectShows[key] = false
    return
  }

  updateDynamicSelectLayout(key, optionCount)
  dynamicSelectShows[key] = true
}

function renderThemeLabel(option: SelectOption): VNodeChild {
  return [
    h('span', {
      style: {
        background: getPrimaryColor(themeType.value, option.value as PrimaryColor),
        borderRadius: '2px',
        display: 'inline-block',
        height: '.75rem',
        marginRight: '.5rem',
        verticalAlign: 'middle',
        width: '.75rem',
      },
    }),
    option.label as string,
  ]
}

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
  await callIpc('auto-start', val)
}

async function onDevToolsChange(val: boolean) {
  await callIpc('reg-dev-tools', val)
}

async function onDockIconChange(val: boolean) {
  await callIpc('dock-icon-show', val)
}

watch(updateSource, (newValue) => {
  window.ipcRenderer.send('change-update-source', newValue)
})

watch([npmRegistry, customNpmRegistry], ([registry, custom]) => {
  window.ipcRenderer.send('change-npm-registry', { registry, custom })
})

watch(npmRegistry, async (value) => {
  if (value !== 'custom')
    return

  await nextTick()

  customRegistryFieldRef.value?.scrollIntoView({
    behavior: enableAnimations.value ? 'smooth' : 'auto',
    block: 'nearest',
  })
  customRegistryInputRef.value?.focus()
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
    <n-scrollbar class="setting-content grow-1" content-class="p8 pt12">
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

        <setting-item title="主题颜色" desc="修改全局的主题颜色">
          <n-select
            v-model:value="primaryColor"
            :options="primaryColorOptions"
            :render-label="renderThemeLabel"
          />
        </setting-item>

        <setting-item
          v-if="primaryColor === 'custom'"
          title="自定义颜色"
          desc="选择你喜欢的主题颜色"
        >
          <n-color-picker
            v-model:value="customPrimaryColor"
            :show-alpha="false"
            placement="left"
          />
        </setting-item>

        <setting-item title="侧边栏宽度" desc="调整左侧导航栏的宽度">
          <n-select
            v-model:value="sidebarWidth"
            :options="sidebarWidthOptions"
          />
        </setting-item>

        <setting-item title="界面圆角" desc="调整界面组件的圆角大小">
          <n-select
            v-model:value="borderRadius"
            :options="borderRadiusOptions"
          />
        </setting-item>

        <setting-item title="动画效果" desc="开启或关闭界面过渡动画">
          <n-switch
            v-model:value="enableAnimations"
            :round="false"
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

        <setting-item title="更新源" desc="当无法访问GitHub时可切换为国内源">
          <div
            ref="updateSourceTriggerRef"
            class="w50"
          >
            <n-select
              v-model:value="updateSource"
              v-bind="floatingSelectProps"
              :menu-props="getDynamicSelectMenuProps('updateSource')"
              :options="updateOptions"
              :placement="dynamicSelectPlacements.updateSource"
              :show="dynamicSelectShows.updateSource"
              size="medium"
              @update:show="onDynamicSelectShowChange('updateSource', $event, updateOptions.length)"
            />
          </div>
        </setting-item>

        <setting-item title="插件源" desc="用于搜索和安装插件的包管理源">
          <div
            ref="npmRegistryTriggerRef"
            class="w50"
          >
            <n-select
              v-model:value="npmRegistry"
              v-bind="floatingSelectProps"
              :menu-props="getDynamicSelectMenuProps('npmRegistry')"
              :options="npmRegistryOptions"
              :placement="dynamicSelectPlacements.npmRegistry"
              :show="dynamicSelectShows.npmRegistry"
              size="medium"
              @update:show="onDynamicSelectShowChange('npmRegistry', $event, npmRegistryOptions.length)"
            />
          </div>
        </setting-item>

        <div v-if="npmRegistry === 'custom'" ref="customRegistryFieldRef">
          <setting-item
            title="自定义插件源"
            desc="输入自定义插件源地址"
          >
            <n-input
              ref="customRegistryInputRef"
              v-model:value="customNpmRegistry"
              placeholder="https://registry.npmjs.org"
              :style="{ width: '300px' }"
            />
          </setting-item>
        </div>

        <setting-item title="显示任务栏图标" desc="是否显示 系统Dock栏/任务栏 应用图标">
          <n-switch
            v-model:value="showDockIcon"
            :round="false"
            @update-value="onDockIconChange"
          />
        </setting-item>
      </template>

      <template v-else-if="activeIndex === 2">
        <setting-item title="开发者工具">
          <template #desc>
            使用快捷键
            <keycut ctrl shift text="D" />
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
  --uno: p0 w80vw max-w-1024px h80vh max-h-720px overflow-hidden rounded-2;
}
.setting-panel > .n-card-header {
  --uno: absolute left-0 right-0 z-1 text-4 py4 pr4;
}
.setting-panel > :is(.n-card-content, .n-card__content) {
  --uno: p0 h-full rounded-2;
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
