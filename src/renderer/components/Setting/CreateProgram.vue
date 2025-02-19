<script setup lang="ts">
import { type ProgramType, programTypeName, useProgramStore } from '~/stores'

const emit = defineEmits<{
  close: []
}>()

const programStore = useProgramStore()
const router = useRouter()

const options = Object.entries(programTypeName).map(([key, value]) => ({
  label: value,
  value: key as ProgramType,
}))

const selectedType = ref<ProgramType>('lsky')

function finishCreateProgram() {
  const id = programStore.createProgram(selectedType.value)
  emit('close')
  router.push(`/Setting/${id}`)
}
</script>

<template>
  <n-select v-model:value="selectedType" class="mb6" :options />
  <n-flex align="center" justify="end">
    <n-button type="primary" class="wfull" @click="finishCreateProgram()">
      创建
    </n-button>
  </n-flex>
</template>
