<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import requestUtils from '~/api'
import CodeInput from '~/components/Common/CodeInput.vue'
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
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          API 地址
        </div>
        <n-text class="text-xs op80">
          http(s)://域名，不含尾随斜杠
        </n-text>
      </div>
      <CodeInput v-model:value="setting.api" type="text" placeholder="请填写图床API地址" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          Token
        </div>
        <n-text class="text-xs op80">
          例如：1|1bJbwlqBfnggmOMEZqXT5XusaIwqiZjCDs7r1Ob5
        </n-text>
      </div>
      <CodeInput v-model:value="setting.token" type="text" placeholder="请填写图床生成的Token" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          存储策略
        </div>
      </div>
      <div class="flex gap-1">
        <n-select v-model:value="activeStrategy" :options="setting.strategies" />
        <n-button @click="syncStrategies">
          <div i-ic-round-refresh />
        </n-button>
      </div>
    </n-card>
  </n-form>
</template>

<style scoped>
.set-item :deep(.n-card__content) {
  --uno: flex flex-row items-center justify-between;
}

.set-item :deep(.n-select) {
  --uno: w50;
}

.set-item :deep(.n-input) {
  --uno: w75;
}
:deep(.n-form-item) > .n-form-item-feedback-wrapper {
  --uno: text-xs;
}
</style>
