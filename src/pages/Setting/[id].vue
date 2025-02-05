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
    <setting-item title="存储备注" :desc="`存储类型：${getProgramTypeName(programType)}`">
      <CodeInput
        v-model:value="programName"
        type="text"
        :placeholder="getProgramTypeName(programType)"
      />
    </setting-item>

    <component :is="comp" />

    <setting-item title="删除存储" desc="删除存储会导致配置丢失，请谨慎操作">
      <n-button type="error" :secondary="true" @click="openRemoveDialog">
        删除存储
      </n-button>
    </setting-item>
  </n-form>
</template>
