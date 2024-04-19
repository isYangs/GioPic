<script setup lang="ts">
import type { FormInst, FormItemRule, FormRules } from 'naive-ui'
import { useStorageAppStore } from '~/stores'
import * as validate from '~/utils'
import { throttle } from '~/utils'

const api = ref('')
const token = ref('')
const storageAppStore = useStorageAppStore()

const { lskyProApi, lskyProToken } = storeToRefs(storageAppStore)
const formRef = ref<FormInst | null>(null)

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
const lskyProSetRules: FormRules = {
  apiUrl: createFormRule(() => validate.validateUrl(api.value)),
  token: createFormRule(() => validate.validateLskyToken(token.value)),
}

function saveSet() {
  return new Promise((resolve) => {
    if (formRef.value) {
      formRef.value.validate((errors) => {
        if (!errors) {
          lskyProApi.value = api.value.trim()
          lskyProToken.value = token.value.trim()
          resolve(true)
        }
        else {
          window.$message.error('保存失败，请检查设置是否填写有误')
          resolve(false)
        }
      })
    }
    else {
      resolve(false)
    }
  })
}

const getStrategies = throttle(async () => {
  const loading = window.$message.loading('正在获取策略列表...')
  if (!await storageAppStore.getLskyProStrategies())
    window.$message.error('获取策略列表失败，请检查设置是否填写有误')
  loading.destroy()
}, { value: 1, unit: '秒' })

defineExpose({
  saveSet,
  getStrategies,
})
</script>

<template>
  <n-form ref="formRef" :rules="lskyProSetRules">
    <n-form-item path="apiUrl" label="请输入API地址">
      <n-input v-model:value="api" placeholder="请填写图床API地址" />
    </n-form-item>
    <n-form-item path="token" label="请输入Token">
      <n-input v-model:value="token" placeholder="请输入图床Token" />
    </n-form-item>
  </n-form>
</template>

<style scoped></style>
