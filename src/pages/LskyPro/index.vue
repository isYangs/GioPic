<script setup lang="ts">
import { NButton, NInput, NSelect } from 'naive-ui'
import type { FormItemRule, FormRules } from 'naive-ui'
import * as validate from '~/utils'
import { useLskyStore } from '~/stores'
import type { SetItem as SetItemApi } from '~/components/Setting/SetItem.vue'
import { throttle } from '~/utils'

const lskyApi = ref('')
const lskyToken = ref('')
const lskyStore = useLskyStore()
const { api, token, strategies, strategiesVal } = storeToRefs(lskyStore)
const setItemRef = ref<SetItemApi | null>(null)

if (api.value)
  lskyApi.value = api.value
if (token.value)
  lskyToken.value = token.value

// 表单验证规则
function createFormRule(validator: (value: any) => boolean | Error): FormItemRule {
  return {
    required: true,
    validator: async (_: any, value: any) => {
      const result = validator(value)
      if (result instanceof Error)
        throw result.message
    },
    trigger: ['input', 'blur', 'change'],
  }
}

// 表单验证规则
const lskySetRules: FormRules = {
  apiUrl: createFormRule(() => validate.validateUrl(lskyApi.value)),
  token: createFormRule(() => validate.validateLskyToken(lskyToken.value)),
}

// 设置面板的保存
function saveSet() {
  if (setItemRef.value) {
    setItemRef.value.formValidation(
      () => {
        api.value = lskyApi.value.trim()
        token.value = lskyToken.value.trim()
      },
      () => {
        window.$message.error('保存失败，请检查设置是否填写有误')
      },
    )
  }
}

const getStrategies = throttle(async () => {
  const loading = window.$message.loading('正在获取策略列表...')
  if (!await lskyStore.getStrategies())
    window.$message.error('获取策略列表失败，请检查设置是否填写有误')
  loading.destroy()
}, { value: 1, unit: '小时' })

const lskySettingOptions = [
  {
    name: 'API 地址',
    tip: 'https://example.com (必须包含http://或https://)',
    width: 300,
    path: 'apiUrl',
    component: () => {
      return h(NInput, {
        value: lskyApi.value,
        placeholder: '请填写图床API地址',
        onUpdateValue: (val: string) => {
          lskyApi.value = val
        },
        onBlur: () => {
          saveSet()
        },
      })
    },
  },
  {
    name: 'Token',
    tip: '例如：1|1bJbwlqBfnggmOMEZqXT5XusaIwqiZjCDs7r1Ob5',
    width: 300,
    path: 'token',
    component: () => {
      return h(NInput, {
        value: lskyToken.value,
        placeholder: '请填写图床生成的Token',
        onUpdateValue: (val: string) => {
          lskyToken.value = val
        },
        onBlur: () => {
          saveSet()
        },
      })
    },
  },
  {
    name: '存储策略',
    component: () => {
      return h('div', { class: 'flex' }, {
        default: () => [
          h(NSelect, {
            value: strategiesVal.value,
            onUpdateValue: (val: number) => {
              strategiesVal.value = val
            },
            options: strategies.value,
          }),
          h(NButton, {
            onClick: getStrategies,
          }, {
            default: () => '获取',
          }),
        ],
      })
    },
  },
]
</script>

<template>
  <div>
    <n-tabs type="segment" animated>
      <n-tab-pane name="upload" tab="上传图片">
        <Upload />
      </n-tab-pane>
      <n-tab-pane name="set" tab="设置">
        <SetItem ref="setItemRef" title="兰空图床设置" :items="lskySettingOptions" :rules="lskySetRules" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>
