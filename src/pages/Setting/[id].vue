<script setup lang="ts">
import { NButton, NInput, NSelect } from 'naive-ui'
import { useStorageListStore } from '~/stores'
import type { StorageListName } from '~/types'
import { getStorageName } from '~/utils'

const router = useRouter()
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
      const keys = getKeys(id.value)
      if (!keys)
        return h('div')

      return h('div', { class: 'flex' }, {
        default: () => [
          h(NSelect, {
            value: strategiesVal.value,
            onUpdateValue: (val: number) => {
              strategiesVal.value = val
            },
            options: keys.strategies,
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
  const keys = getKeys(id.value)
  keys.api = api.value
  keys.token = token.value
  keys.strategiesVal = strategiesVal.value
  window.$message.success('保存成功')
}

function delSetting() {
  const index = storageList.value.findIndex(item => item.id === id.value)
  console.log(index)
  if (index !== -1) {
    storageList.value.splice(index, 1)
    api.value = ''
    token.value = ''
    strategiesVal.value = null

    router.push(storageList.value.length > 0 ? `/Setting/${storageList.value[0].id}` : '/')

    window.$message.success('删除成功')
  }
  else {
    window.$message.error('删除失败，未找到对应的存储项')
  }
}

watchEffect(() => {
  id.value = route.params.id as StorageListName
  const keys = getKeys(id.value)
  if (!keys) {
    api.value = ''
    token.value = ''
    strategiesVal.value = null
    return
  }
  api.value = keys.api
  token.value = keys.token
  strategiesVal.value = keys.strategiesVal
})
</script>

<template>
  <div wh-full>
    <SetItem ref="setItemRef" :title="`${getStorageName(id)}设置`" :items="settingOptions" style="padding-top: 0;" />
    <n-flex justify="end" mt3>
      <NButton type="primary" @click="saveSetting">
        保存设置
      </NButton>
      <NButton type="error" @click="delSetting">
        删除此存储
      </NButton>
    </n-flex>
  </div>
</template>
