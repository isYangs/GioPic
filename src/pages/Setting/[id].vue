<script setup lang="ts">
import { NButton, NInput, NSelect } from 'naive-ui'
import { useStorageListStore } from '~/stores'
import type { StorageListName } from '~/types'
import { getStorageName } from '~/utils'

const route = useRoute('/Setting/[id]')
const id = ref(route.params.id as StorageListName)
const storageListStore = useStorageListStore()
const { storageList } = storeToRefs(storageListStore)

const api = ref('')
const token = ref('')
const strategiesVal = ref<number | null>(null)

const settingOptions = computed(() => [
  {
    name: 'API 地址',
    tip: 'https://example.com (必须包含http://或https://)',
    width: 300,
    path: 'apiUrl',
    component: () => {
      return h(NInput, {
        value: api.value,
        placeholder: '请填写图床API地址',
        onUpdateValue: (val: string) => {
          api.value = val
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
        value: token.value,
        placeholder: '请填写图床生成的Token',
        onUpdateValue: (val: string) => {
          token.value = val
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
            options: getKeys(id.value).strategies,
          }),
          h(NButton, {
            onClick: async () => {
              const loading = window.$message.loading('正在获取策略列表...')
              if (!await storageListStore.getStrategies(id.value))
                window.$message.error('获取策略列表失败，请检查设置是否填写有误')
              loading.destroy()
            },
          }, {
            default: () => '获取',
          }),
        ],
      })
    },
  },
])

function getKeys(type: StorageListName) {
  const storageIndex = storageList.value.findIndex(item => item.id === type)
  return storageList.value[storageIndex]
}

function saveSetting() {
  getKeys(id.value).api = api.value
  getKeys(id.value).token = token.value
  getKeys(id.value).strategiesVal = strategiesVal.value
}

watchEffect(() => {
  id.value = route.params.id as StorageListName
  api.value = getKeys(id.value).api
  token.value = getKeys(id.value).token
  strategiesVal.value = getKeys(id.value).strategiesVal
})
</script>

<template>
  <div wh-full>
    <SetItem ref="setItemRef" :title="`${getStorageName(id)}设置`" :items="settingOptions" style="padding-top: 0;" />
    <n-flex justify="end" mt3>
      <NButton type="primary" @click="saveSetting">
        保存设置
      </NButton>
      <NButton type="error">
        删除此存储
      </NButton>
    </n-flex>
  </div>
</template>
