<script setup lang="ts">
import { NButton, NSelect, NSwitch, useOsTheme } from 'naive-ui'
import Keycut from '~/components/Partial/Keycut.vue'
import { useAppStore } from '~/stores'
import type { TabOption } from '~/types'
import debounce from '~/utils/debounce'

const appStore = useAppStore()
const {
  appCloseTip,
  appCloseType,
  autoStart,
  autoUpdate,
  isDevToolsOpen,
  themeType,
  themeAuto,
} = storeToRefs(appStore)

const osThemeRef = useOsTheme()

const setTabsVal = ref('setTab1')
const isUserScroll = ref(false)

const tabsOptions = ref<TabOption[]>([
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
        isDev: true,
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
          value: isDevToolsOpen.value,
          round: false,
          onUpdateValue: (val: boolean) => {
            isDevToolsOpen.value = val
            window.ipcRenderer.invoke('devtools', val)
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
        }, () => '重置'),
      },
    ],
  },
])

// 切换Tab
function setTabChange(name: string) {
  isUserScroll.value = true // 用户主动切换Tab时设置标志位
  nextTick(() => {
    const index = Number(name.replace('setTab', '')) - 1
    const setEl = document.querySelectorAll('.set-type')[index] as HTMLElement
    if (!setEl)
      return
    setEl.scrollIntoView({
      behavior: 'smooth',
    })
  })
}

// 滚动监听
const allSetScroll = debounce((e) => {
  if (isUserScroll.value) {
    isUserScroll.value = false // 重置标志位
    return
  }

  const distance = e.target.scrollTop + 30
  const allSetDom = document.querySelectorAll('.set-type')
  allSetDom.forEach((v, i) => {
    const el = v as HTMLElement
    if (distance >= el.offsetTop)
      setTabsVal.value = `setTab${i + 1}`
  })
}, 100)

onMounted(async () => {
  // 默认选中第一个Tab并滚动到第一个Tab区域
  nextTick(() => {
    setTabsVal.value = 'setTab1'
    const setEl = document.querySelector('.set-type') as HTMLElement
    if (setEl) {
      setEl.scrollIntoView({
        behavior: 'smooth',
      })
    }
  })
})
</script>

<template>
  <div class="wh-full">
    <div class="select-none text-4xl font-600">
      程序设置
    </div>
    <div class="select-none pt10">
      <n-tabs
        v-model:value="setTabsVal"
        type="segment"
        @update:value="setTabChange"
      >
        <n-tab
          v-for="(tab, index) in tabsOptions"
          :key="tab.title"
          :name="`setTab${index + 1}`"
          :tab="tab.title"
        />
      </n-tabs>

      <n-scrollbar
        :style="{
          height: `calc(100vh - 228px)`,
        }"
        class="all-set"
        @scroll="allSetScroll"
      >
        <SetItem v-for="tab in tabsOptions" :key="tab.title" :title="tab.title" :items="tab.items" />
      </n-scrollbar>
    </div>
  </div>
</template>
