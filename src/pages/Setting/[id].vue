<script setup lang="ts">
import type { Component } from 'vue'
import { NButton, NInput } from 'naive-ui'
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

const generalSettings = computed(() => [
  {
    name: '存储备注',
    tip: `存储类型：${getProgramTypeName(programType.value)}`,
    width: 300,
    component: () => h(NInput, {
      value: programName.value,
      placeholder: getProgramTypeName(programType.value),
      onUpdateValue: (newName: string) => {
        programName.value = newName
      },
    }),
  },
])

const dangerousSettings = computed(() => [
  {
    name: '删除存储',
    tip: '删除存储会导致配置丢失，请谨慎操作',
    component: () => h(NButton, {
      type: 'error',
      secondary: true,
      onClick: () => {
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
      },
    }, { default: () => '删除存储' }),
  },
])

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
</script>

<template>
  <div>
    <setting-section :items="generalSettings" />
    <component :is="comp" />
    <setting-section :items="dangerousSettings" />
  </div>
</template>
