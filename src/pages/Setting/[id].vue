<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import { useStorageListStore } from '~/stores'
import { createApiSettingOptions, createFormRule, createStrategiesSettingOptions, createTokenSettingOptions, getStorageName, validateLskyToken, validateUrl } from '~/utils'

// const params = useRoute('/Setting/[id]').params
const storageListStore = useStorageListStore()

const {
  selectStorageVal,
  lskyProApi,
  lskyProToken,
} = storeToRefs(storageListStore)

const lskySettingOptions = [
  createApiSettingOptions('API 地址', 'https://example.com (必须包含http://或https://)', 'apiUrl', '请填写图床API地址'),
  createTokenSettingOptions('Token', '例如：1|1bJbwlqBfnggmOMEZqXT5XusaIwqiZjCDs7r1Ob5', 'token', '请填写图床生成的Token'),
  createStrategiesSettingOptions('存储策略', '获取', async () => {
    const loading = window.$message.loading('正在获取策略列表...')
    if (!await storageListStore.getLskyStrategies( lskyProApi.value, lskyProToken.value))
      window.$message.error('获取策略列表失败，请检查设置是否填写有误')
    loading.destroy()
  }),
]

const lskySetRules: FormRules = {
  apiUrl: createFormRule(() => validateUrl(lskyProApi.value)),
  token: createFormRule(() => validateLskyToken(lskyProToken.value)),
}
</script>

<template>
  <div wh-full>
    <SetItem ref="setItemRef" :title="`${getStorageName(selectStorageVal)}设置`" :items="lskySettingOptions" :rules="lskySetRules" style="padding-top: 0;" />
  </div>
</template>

<style scoped></style>
