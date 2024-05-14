<script setup lang="ts">
import { NButton, NInput, NSelect, NSwitch, useOsTheme } from 'naive-ui'
import { getLinkTypeOptions } from '~/utils'
import { useAppStore } from '~/stores'
import type { TabOption } from '~/types'

const appStore = useAppStore()
const {
  appCloseTip,
  appCloseType,
  autoStart,
  themeType,
  themeAuto,
  imgLinkFormatVal,
} = storeToRefs(appStore)
const osThemeRef = useOsTheme()
const shortcutKeys = ref('')

const tabsOptions: TabOption[] = [
  {
    title: '常规',
    items: [
      {
        name: '深浅模式',
        component: () => {
          return h(NSelect, {
            value: themeType.value,
            onUpdateValue: (val: 'dark' | 'light') => {
              themeAuto.value = false
              themeType.value = val
            },
            options: [
              { label: '浅色模式', value: 'light' },
              { label: '深色模式', value: 'dark' },
            ],
          })
        },
      },
      {
        name: '深浅模式是否跟随系统',
        component: () => {
          return h(NSwitch, {
            value: themeAuto.value,
            round: false,
            onUpdateValue: (val: boolean) => {
              themeAuto.value = val
              if (val)
                themeType.value = osThemeRef.value
            },
          })
        },
      },
      {
        name: '链接展示格式',
        tip: '图片上传后要展示的链接格式',
        width: 400,
        component: () => {
          return h(NSelect, {
            value: imgLinkFormatVal.value,
            placeholder: '请选择要展示什么格式的链接',
            multiple: true,
            onUpdateValue: (val) => {
              imgLinkFormatVal.value = val
            },
            options: getLinkTypeOptions(),
          })
        },
      },
    ],
  },
  {
    title: '系统',
    items: [
      {
        name: '是否开机自启动',
        component: () => {
          return h(NSwitch, {
            value: autoStart.value,
            round: false,
            onUpdateValue: (val: boolean) => {
              autoStart.value = val
              window.ipcRenderer.send('auto-start', val)
            },
          })
        },
      },
      {
        name: '关闭程序时',
        component: () => {
          return h(NSelect, {
            value: appCloseType.value,
            disabled: appCloseTip.value,
            onUpdateValue: (val: 'hide' | 'close') => {
              appCloseType.value = val
            },
            options: [
              { label: '最小化到任务栏', value: 'hide' },
              { label: '直接退出', value: 'close' },
            ],
          })
        },
      },
      {
        name: '每次关闭程序时都询问',
        component: () => {
          return h(NSwitch, {
            value: appCloseTip.value,
            round: false,
            onUpdateValue: (val: boolean) => {
              appCloseTip.value = val
            },
          })
        },
      },
    ],
  },
  {
    title: '快捷键',
    items: [
      {
        name: '上传图片',
        isDev: true,
        component: () => {
          return h(NInput, {
            value: shortcutKeys.value,
            placeholder: '请输入快捷键',
            onKeydown: (e: KeyboardEvent) => {
              e.preventDefault()
              console.log(e)
            },
          })
        },
      },
    ],
  },
  {
    title: '其他',
    items: [
      {
        name: '程序重置',
        tip: '若程序显示异常或出现问题时可尝试此操作',
        component: () => {
          return h(NButton, {
            type: 'error',
            strong: true,
            secondary: true,
          }, () => '重置')
        },
      },
    ],
  },
]
</script>

<template>
  <div wh-full>
    <div select-none text-4xl font-600>
      程序设置
    </div>
    <div select-none pt10>
      <n-tabs
        type="segment"
        animated
      >
        <n-tab-pane
          v-for="tab, in tabsOptions"
          :key="tab.title"
          :name="tab.title"
          :tab="tab.title"
        >
          <SetItem :title="tab.title" :items="tab.items" />
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>
