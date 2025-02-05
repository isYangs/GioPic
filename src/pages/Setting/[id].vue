<script setup lang="ts">
import type { Component } from 'vue'
import { useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const router = useRouter()
const id = computed(() => Number.parseInt(route.params.id))

const programStore = useProgramStore()
const {
  getProgram,
  getProgramTypeName,
  setProgramName,
  removeProgram,
} = programStore

const programType = computed(() => getProgram(id.value)?.type)
const programName = computed({
  get: () => getProgram(id.value)?.name,
  set: newName => setProgramName(id.value, newName),
})

// 根据类型动态加载组件
const compName = computed(() => {
  if (!programType.value)
    return 'Lsky'
  if (programType.value === 'lskyPro') {
    return 'Lsky'
  }
  return programType.value[0].toUpperCase() + programType.value.slice(1)
})

const comp = shallowRef<Component>()

watchImmediate([() => route.params.id, programType], () => {
  comp.value = defineAsyncComponent(() => import(`~/components/Setting/Config${compName.value}.vue`))
})

function openRemoveDialog() {
  window.$dialog.warning({
    title: '提示',
    content: '删除存储会导致配置丢失，是否继续？',
    positiveText: '确定',
    negativeText: '取消',
    autoFocus: false,
    onPositiveClick: () => {
      const prevIndex = removeProgram(id.value)
      window.$message.success('删除成功')
      const nextId = programStore.programs[prevIndex]?.id
      router.push(`/Setting/${nextId ?? ''}`)
    },
  })
}
</script>

<template>
  <n-form>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          存储备注
        </div>
        <n-text class="text-xs op80">
          存储类型：{{ getProgramTypeName(programType) }}
        </n-text>
      </div>
      <CodeInput
        v-model:value="programName"
        type="text"
        :placeholder="getProgramTypeName(programType)"
      />
    </n-card>
    <component :is="comp" />
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          删除存储
        </div>
        <n-text class="text-xs op80">
          删除存储会导致配置丢失，请谨慎操作
        </n-text>
      </div>
      <n-button type="error" :secondary="true" @click="openRemoveDialog">
        删除存储
      </n-button>
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
