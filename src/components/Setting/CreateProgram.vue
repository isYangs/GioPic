<script setup lang="ts">
import type { ProgramType } from '~/stores'

const showCreateProgram = defineModel<boolean>()
const programStore = useProgramStore()
const router = useRouter()

const selectedType = ref<ProgramType>('lsky')

function finishCreateProgram() {
  const id = programStore.createProgram(selectedType.value)
  showCreateProgram.value = false
  router.push(`/Setting/${id}`)
}
</script>

<template>
  <n-modal
    v-model:show="showCreateProgram"
    :auto-focus="false"
    :mask-closable="false"
    :bordered="false"
    :close-on-esc="false"
    :closable="false"
    preset="card"
    title="选择要创建的存储类型"
    transform-origin="center"
  >
    <n-select v-model:value="selectedType" :options="programStore.getProgramTypeList()" />
    <template #footer>
      <n-flex align="center" justify="end">
        <n-button :focusable="false" strong secondary @click="showCreateProgram = false">
          取消
        </n-button>
        <n-button type="primary" :focusable="false" strong secondary @click="finishCreateProgram()">
          创建
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
