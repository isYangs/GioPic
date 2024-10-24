<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import { NButton, NInput, NSelect } from 'naive-ui'
import { useProgramsStore } from '~/stores'
import type { ProgramsName } from '~/types'
import {
  createFormRule,
  getProgramsName,
  renderIcon,
  validateLskyToken,
  validateUrl,
} from '~/utils'

const route = useRoute('/Setting/[id]')
const id = ref(route.params.id as ProgramsName)
const programsStore = useProgramsStore()
const api = ref('')
const token = ref('')
const strategiesVal = ref<number | null>(null)

const settings = computed(() => programsStore.getPrograms(id.value))

const setItem = useTemplateRef('setItemRef')

const rules: FormRules = {
  apiUrl: createFormRule(() => validateUrl(api.value)),
  token: createFormRule(() => validateLskyToken(token.value)),
}

const settingOptions = computed(() => [
  {
    name: 'API 地址',
    tip: 'http(s)://域名，不含尾随斜杠',
    width: 300,
    path: 'apiUrl',
    component: () => {
      return h(NInput, {
        value: api.value,
        placeholder: '请填写图床API地址',
        onUpdateValue: (val: string) => {
          api.value = val
        },
        onChange: formValidation,
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
        onChange: formValidation,
      })
    },
  },
  {
    name: '存储策略',
    component: () => {
      return h('div', { class: 'flex gap-1' }, {
        default: () => [
          h(NSelect, {
            value: strategiesVal.value,
            onUpdateValue: (val: number) => {
              strategiesVal.value = val
              saveSetting()
            },
            options: settings.value.strategies,
          }),
          h(NButton, {
            onClick: syncStrategies,
          }, {
            default: renderIcon('i-ic-round-refresh'),
          }),
        ],
      })
    },
  },
])

function formValidation() {
  setItem.value?.formValidation(() => {
    settings.value.strategiesVal = null
    settings.value.strategies = []
    saveSetting()
  })
}

async function syncStrategies() {
  const loading = window.$message.loading('正在同步线上策略列表...')
  if (!await programsStore.getStrategies(id.value))
    window.$message.error('同步策略列表失败，请检查设置是否填写有误')
  loading.destroy()
}

async function saveSetting() {
  programsStore.setPrograms(id.value, 'api', api.value)
  programsStore.setPrograms(id.value, 'token', token.value)
  if (settings.value.strategiesVal === null)
    await syncStrategies()
  programsStore.setPrograms(id.value, 'strategiesVal', strategiesVal.value)
  window.$message.success('保存成功')
}

watchEffect(() => {
  id.value = route.params.id as ProgramsName
  api.value = settings.value.api
  token.value = settings.value.token
  strategiesVal.value = settings.value.strategiesVal
})
</script>

<template>
  <div wh-full>
    <SettingSection ref="setItemRef" class="pt0" :title="getProgramsName(id)" :items="settingOptions" :rules />
  </div>
</template>
