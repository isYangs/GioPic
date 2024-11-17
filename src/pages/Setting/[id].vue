<script setup lang="ts">
import { NInput, NSelect } from 'naive-ui'
import type { ProgramType } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))

const programStore = useProgramStore()
const programType = ref(programStore.getProgram(id.value)?.type)

const typeSettings = computed(() => [
  {
    name: '存储类型',
    tip: '切换存储类型会导致配置丢失，请谨慎操作',
    width: 300,
    component: () => h(NSelect, {
      value: programType.value,
      onUpdateValue: (newType: ProgramType) => {
        window.$dialog.warning({
          title: '提示',
          content: '切换存储类型会导致配置丢失，是否继续？',
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: () => {
            programStore.initProgram(id.value, newType)
            programType.value = newType
          },
        })
      },
      options: programStore.getProgramTypeList(),
    }),
  },
  {
    name: '存储名称',
    tip: '存储名称用于区分不同的存储',
    width: 300,
    component: () => h(NInput, {
      value: programStore.getProgram(id.value)?.name,
      onUpdateValue: (newName: string) => {
        programStore.renameProgram(id.value, newName)
      },
    }),
  },
])

const compName = computed(() => {
  if (!programType.value)
    return 'Lsky'
  if (programType.value === 'lskyPro') {
    return 'Lsky'
  }
  return programType.value[0].toUpperCase() + programType.value.slice(1)
})

const comp = ref()

watchImmediate([() => route.params.id, programType], () => {
  comp.value = defineAsyncComponent(() => import(`~/components/Setting/Config${compName.value}.vue`))
  programType.value = programStore.getProgram(id.value)?.type
})
</script>

<template>
  <div wh-full>
    <setting-section :items="typeSettings" />
    <component :is="comp" />
  </div>
</template>
