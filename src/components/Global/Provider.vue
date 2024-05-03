<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import { darkTheme, dateZhCN, useOsTheme, zhCN } from 'naive-ui'
import { createTextVNode } from 'vue'
import { useAppStore } from '~/stores'

const appStroe = useAppStore()
const { themeType, themeAuto } = storeToRefs(appStroe)
const osThemeRef = useOsTheme()
const theme = ref(themeType.value === 'dark' ? darkTheme : null)
const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: 'rgb(51,54,57)',
    primaryColorHover: 'rgb(51,54,57)',
    primaryColorSuppl: 'rgb(51,54,57)',
    primaryColorPressed: 'rgb(149,158,168)',
    modalColor: 'rgb(250,250,252)',
  },
  Menu: {
    itemColorActive: 'rgb(221,221,221)',
    itemColorActiveHover: 'rgb(221,221,221)',
    itemColorActiveCollapsed: 'rgb(221,221,221)',
    itemIconColorActive: 'var(--n-item-icon-color)',
    itemIconColorActiveHover: 'var(--n-item-icon-color)',
    itemTextColorActive: 'var(--n-item-text-color)',
    itemTextColorActiveHover: 'var(--n-item-text-color)',
    arrowColorActive: 'rgb(221,221,221)',
    arrowColorActiveHover: 'rgb(221,221,221)',
    arrowColorActiveCollapsed: 'rgb(221,221,221)',
  },
}

const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: 'rgba(255,255,255,.82)',
    primaryColorHover: 'rgba(255,255,255,.82)',
    primaryColorSuppl: 'rgba(255,255,255,.82)',
    primaryColorPressed: 'rgba(255,255,255,.26)',
  },
  Menu: {
    itemColorActive: 'rgb(31,40,50)',
    itemColorActiveHover: 'rgb(31,40,50)',
    itemColorActiveCollapsed: 'rgb(31,40,50)',
    itemIconColorActive: 'var(--n-item-icon-color)',
    itemIconColorActiveHover: 'var(--n-item-icon-color)',
    itemTextColorActive: 'var(--n-item-text-color)',
    itemTextColorActiveHover: 'var(--n-item-text-color)',
    arrowColorActive: 'rgb(31,40,50)',
    arrowColorActiveHover: 'rgb(31,40,50)',
    arrowColorActiveCollapsed: 'rgb(31,40,50)',
  },
}

function setupNaiveTools() {
  // 对话框
  window.$dialog = useDialog()
  // 消息
  window.$message = useMessage()
  // 通知
  window.$notification = useNotification()
  // 加载条
  window.$loadingBar = useLoadingBar()
}

const NaiveProviderContext = defineComponent({
  setup() {
    setupNaiveTools()
    return () => createTextVNode()
  },
})

// 监听主题变化
watch(themeType, (val) => {
  if (val === 'dark')
    theme.value = darkTheme
  else
    theme.value = null
})

// 监听系统主题变化
watch(osThemeRef, (val) => {
  if (themeAuto)
    themeType.value = val
})
</script>

<template>
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="theme"
    :theme-overrides="theme === null ? lightThemeOverrides : darkThemeOverrides"
    abstract
    inline-theme-disabled
  >
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider :max="1" container-style="margin-top:3.5rem">
          <n-message-provider :max="1" placement="bottom">
            <slot />
            <NaiveProviderContext />
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
