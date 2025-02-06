<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import requestUtils from '~/api'
import type { ProgramDetail } from '~/stores'
import { useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))
const programStore = useProgramStore()
const activeStrategy = ref<number | null>(null)

const setting = computed({
  get: () => programStore.getProgram(id.value).detail as ProgramDetail['lsky'],
  set: val => programStore.setProgramDetail(id.value, val),
})

const setItem = useTemplateRef('setFormRef')

const rules: FormRules = {
  // apiUrl: createFormRule(() => validateUrl(api.value)),
  // token: createFormRule(() => validateLskyToken(token.value)),
}

// function formValidation() {
//   setItem.value?.formValidation(() => {
//     setting.value.activeStrategy = null
//     setting.value.strategies = []
//     saveSetting()
//   })
// }

async function syncStrategies() {
  const loading = window.$message.loading('正在同步线上策略列表...')
  if (!await requestUtils.getStrategies(id.value))
    window.$message.error('同步策略列表失败，请检查设置是否填写有误')
  loading.destroy()
}
</script>

<template>
  <n-form ref="setFormRef" :rules="rules">
    <setting-item title="API 地址" desc="http(s)://域名，不含尾随斜杠">
      <code-input v-model:value="setting.api" type="text" placeholder="请填写图床API地址" />
    </setting-item>

    <setting-item title="Token" desc="例如：1|1bJbwlqBfnggmOMEZqXT5XusaIwqiZjCDs7r1Ob5">
      <code-input v-model:value="setting.token" type="text" placeholder="请填写图床生成的Token" />
    </setting-item>

    <setting-item title="存储策略">
      <div class="flex gap-1">
        <n-select v-model:value="activeStrategy" :options="setting.strategies" />
        <n-button @click="syncStrategies">
          <div i-ic-round-refresh />
        </n-button>
      </div>
    </setting-item>
  </n-form>
</template>
