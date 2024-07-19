<script setup lang="ts">
import { NButton, NInput, NSelect } from 'naive-ui'
import { useProgramsStore } from '~/stores'
import { getProgramsName } from '~/utils'
import type { ProgramsName } from '~/types'

const route = useRoute('/Setting/[id]')
const id = ref(route.params.id as ProgramsName)
const programsStore = useProgramsStore()
const api = ref('')
const token = ref('')
const strategiesVal = ref<number | null>(null)

const settings = computed(() => programsStore.getPrograms(id.value))

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
            options: settings.value.strategies,
          }),
          h(NButton, {
            onClick: async () => {
              const loading = window.$message.loading('正在获取策略列表...')
              if (!await programsStore.getStrategies(id.value))
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

function saveSetting() {
  programsStore.setPrograms(id.value, 'api', api.value)
  programsStore.setPrograms(id.value, 'token', token.value)
  programsStore.setPrograms(id.value, 'strategiesVal', strategiesVal.value)
  window.$message.success('保存成功')
}

// 初始化输入框的值
watch(settings, (newSettings) => {
  api.value = newSettings.api
  token.value = newSettings.token
  strategiesVal.value = newSettings.strategiesVal
}, { immediate: true })

watch(() => route.params.id, (newId) => {
  id.value = newId as ProgramsName
})
</script>

<template>
  <div wh-full>
    <SetItem ref="setItemRef" :title="getProgramsName(id)" :items="settingOptions" style="padding-top: 0;" />
    <n-flex justify="end" mt3>
      <NButton type="primary" @click="saveSetting">
        保存设置
      </NButton>
    </n-flex>
  </div>
</template>
