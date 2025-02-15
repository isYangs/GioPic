<script setup lang="ts">
import requestUtils from '~/api'
import type { ProgramDetail } from '~/stores'
import { useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))
const programStore = useProgramStore()

const setting = computed({
  get: () => programStore.getProgram(id.value).detail as ProgramDetail['lsky'],
  set: val => programStore.setProgramDetail(id.value, val),
})

async function syncStrategies() {
  const loading = window.$message.loading('正在同步线上策略列表...')
  if (!await requestUtils.getStrategies(id.value))
    window.$message.error('同步策略列表失败，请检查设置是否填写有误')
  loading.destroy()
}
</script>

<template>
  <n-form>
    <setting-item title="API 地址" desc="Lsky Pro 图床接口地址">
      <code-input
        v-model:value="setting.api"
        type="text"
        placeholder="http(s)://域名，不含尾随斜杠"
      />
    </setting-item>

    <setting-item title="Token" desc="Lsky Pro 访问令牌">
      <code-input
        v-model:value="setting.token"
        type="text"
        placeholder="1|1bJbwlqBfnggmOMEZqXT5XusaIwqiZjCDs7r1Ob5"
      />
    </setting-item>

    <setting-item title="存储策略" desc="选择上传使用的存储策略">
      <div class="flex gap-1">
        <n-select
          v-model:value="setting.activeStrategy"
          :options="setting.strategies"
          placeholder="请选择存储策略"
        />
        <n-button @click="syncStrategies">
          <div i-ic-round-refresh />
        </n-button>
      </div>
    </setting-item>
  </n-form>
</template>
