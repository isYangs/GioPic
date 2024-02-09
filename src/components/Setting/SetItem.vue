<script setup lang="ts">
import type { VNode } from 'vue'

defineProps<{
  title: string
  items: {
    name: string
    tip?: string
    component: () => VNode
  }[]
}>()

// 通过组件是否为可多选的选择器
function isMultiple(item: any) {
  if (item.component().type.name === 'Select' && item.component().props?.multiple)
    return true
  return false
}

// 通过组件是否为InputGroup
function isInputGroup(item: any) {
  if (item.component().type.name === 'InputGroup')
    return true
  return false
}
</script>

<template>
  <div pt7.5>
    <n-h3 prefix="bar">
      {{ title }}
    </n-h3>
    <n-card v-for="(item, index) in items" :key="index" mb3 wfull rounded-2 class="set-item">
      <div flex="~ col 1" pr font-500>
        {{ item.name }}
        <n-text v-if="item.tip" text-xs op80>
          {{ item.tip }}
        </n-text>
      </div>
      <div :class="isMultiple(item) || isInputGroup(item) ? 'set-item-other' : null">
        <component :is="item.component" />
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.set-item :deep(.n-card__content) {
  --uno: flex flex-row items-center justify-between;
}

.set-item :deep(.n-select) {
  --uno: w50;
}

.set-item .set-item-other {
  --uno: w100;
}

.set-item .set-item-other :deep(.n-select) {
  --uno: w100;
}
</style>
