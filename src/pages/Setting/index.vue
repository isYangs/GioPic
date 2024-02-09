<script setup lang="ts">
import { NButton, NInput, NInputGroup, NSelect, NSwitch, useOsTheme } from 'naive-ui'
import { useAppStore } from '~/stores'

const appStore = useAppStore()
const {
  appCloseTip,
  appCloseType,
  themeType,
  themeAuto,
  imgLinkFormatVal,
  recordSavePath,
} = storeToRefs(appStore)
const osThemeRef = useOsTheme()
const shortcutKeys = ref('')

const tabsOptions = [
  {
    title: '常规',
    items: [
      {
        name: '深浅模式',
        component: () => {
          return h(NSelect, {
            'value': themeType.value,
            'onUpdate:value': (val: 'dark' | 'light') => {
              themeAuto.value = false
              themeType.value = val
            },
            'options': [
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
            'value': themeAuto.value,
            'round': false,
            'onUpdate:value': (val: boolean) => {
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
        width: 'w100',
        component: () => {
          return h(NSelect, {
            'value': imgLinkFormatVal.value,
            'placeholder': '请选择要展示什么格式的链接',
            'multiple': true,
            'onUpdate:value': (val) => {
              imgLinkFormatVal.value = val
            },
            'options': [
              { label: 'URL', value: 'url' },
              { label: 'HTML', value: 'html' },
              { label: 'BBCode', value: 'bbcode' },
              { label: 'Markdown', value: 'markdown' },
              { label: 'Markdown With Link', value: 'markdown_with_link' },
              { label: 'Thumbnail URL', value: 'thumbnail_url' },
            ],
          })
        },
      },
    ],
  },
  {
    title: '系统',
    items: [
      {
        name: '关闭程序时',
        component: () => {
          return h(NSelect, {
            'value': appCloseType.value,
            'disabled': appCloseTip.value,
            'onUpdate:value': (val: 'hide' | 'close') => {
              appCloseType.value = val
            },
            'options': [
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
            'value': appCloseTip.value,
            'round': false,
            'onUpdate:value': (val: boolean) => {
              appCloseTip.value = val
            },
          })
        },
      },
      {
        name: '上传记录文件存储路径',
        component: () => {
          return h(NInputGroup, {}, {
            default: () => [
              h(NInput, {
                value: recordSavePath.value,
                placeholder: '请点击选择上传记录文件存储路径',
                readonly: true,
                onClick: handleSelectPath,
              }),
              h(NButton, {
                ghost: true,
                onClick: handleSelectPath,
              }, {
                default: () => '选择路径',
              }),
            ],
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

function handleSelectPath() {
  window.ipcRenderer.send('open-directory-dialog', 'openDirectory')
  window.ipcRenderer.on('selectedPath', (_e, files) => {
    recordSavePath.value = files
  })
}
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
          <n-scrollbar style="height: calc(100vh - 220px);">
            <SetItem :title="tab.title" :items="tab.items" />
          </n-scrollbar>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>
