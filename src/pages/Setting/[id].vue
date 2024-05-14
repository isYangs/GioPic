<script setup lang="ts">
import { useStorageListStore } from '~/stores'
import type { StorageListName } from '~/types'
import { createApiSettingOptions, createStrategiesSettingOptions, createTokenSettingOptions, getStorageName } from '~/utils'

const route = useRoute('/Setting/[id]')
const id = ref(route.params.id as StorageListName)
const storageListStore = useStorageListStore()

watchEffect(() => {
  id.value = route.params.id as StorageListName
})

const lskySettingOptions = computed(() => [
  createApiSettingOptions(id.value, 'API 地址', 'https://example.com (必须包含http://或https://)', 'apiUrl', '请填写图床API地址'),
  createTokenSettingOptions(id.value, 'Token', '例如：1|1bJbwlqBfnggmOMEZqXT5XusaIwqiZjCDs7r1Ob5', 'token', '请填写图床生成的Token'),
  createStrategiesSettingOptions(id.value, '存储策略', '获取', async () => {
    const loading = window.$message.loading('正在获取策略列表...')
    if (!await storageListStore.getStrategies(id.value))
      window.$message.error('获取策略列表失败，请检查设置是否填写有误')
    loading.destroy()
  }),
])
</script>

<template>
  <div wh-full>
    <SetItem ref="setItemRef" :title="`${getStorageName(id)}设置`" :items="lskySettingOptions" style="padding-top: 0;" />
  </div>
</template>
