<script setup lang="ts">
import type { ProgramsName } from '~/types'

const route = useRoute('/Setting/[id]')
const id = ref(route.params.id as ProgramsName)

const compName = computed(() => {
  if (id.value === 'lskyPro') {
    return 'Lsky'
  }
  return id.value[0].toUpperCase() + id.value.slice(1)
})

const comp = ref()

watchImmediate(() => route.params.id, () => {
  comp.value = defineAsyncComponent(() => import(`~/components/Setting/Config${compName.value}.vue`))
  id.value = route.params.id as ProgramsName
})
</script>

<template>
  <div wh-full>
    <component :is="comp" :id />
  </div>
</template>
