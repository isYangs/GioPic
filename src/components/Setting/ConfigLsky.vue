<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import { NButton, NSelect } from 'naive-ui'
import requestUtils from '~/api'
import CodeInput from '~/components/Common/CodeInput.vue'
import type { ProgramDetail } from '~/stores'
import { useProgramStore } from '~/stores'
import { renderIcon } from '~/utils/main'
import { createFormRule, validateLskyToken, validateUrl } from '~/utils/validate'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))
const programStore = useProgramStore()
const api = ref('')
const token = ref('')
const activeStrategy = ref<number | null>(null)

const settings = computed(() => programStore.getProgram(id.value).detail as ProgramDetail['lsky'])

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
      return h(CodeInput, {
        value: api.value,
        type: 'url',
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
      return h(CodeInput, {
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
            value: activeStrategy.value,
            onUpdateValue: (val: number) => {
              activeStrategy.value = val
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
    settings.value.activeStrategy = null
    settings.value.strategies = []
    saveSetting()
  })
}

async function syncStrategies() {
  const loading = window.$message.loading('正在同步线上策略列表...')
  if (!await requestUtils.getStrategies(id.value))
    window.$message.error('同步策略列表失败，请检查设置是否填写有误')
  loading.destroy()
}

async function saveSetting() {
  programStore.setProgramDetail(id.value, { api: api.value, token: token.value })
  if (api.value && token.value && settings.value.activeStrategy === null)
    await syncStrategies()
  programStore.setProgramDetail(id.value, { activeStrategy: activeStrategy.value })
  window.$message.success('保存成功')
}

watch(() => route.params.id, () => {
  nextTick(() => {
    setItem.value?.resetValidation()
  })
})

watchEffect(() => {
  api.value = settings.value.api
  token.value = settings.value.token
  activeStrategy.value = settings.value.activeStrategy
})
</script>

<template>
  <div>
    <SettingSection ref="setItemRef" class="pt0" :items="settingOptions" :rules />
  </div>
</template>
