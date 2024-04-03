<script setup lang="ts">
import type { FormInst } from 'naive-ui'
import type { TabOption } from '~/types'

export interface SetItem {
  formValidation: (onSuccess: () => void, onError: () => void) => void
}

defineProps<TabOption>()

const setFormRef = ref<FormInst | null>(null)

// 通过组件判断是否为需要设置宽度的组件
function checkComponentType(item: any) {
  switch (item.component().type.name) {
    case 'Select':
      return item.component().props?.multiple !== false
    case 'InputGroup':
      return true
    default:
      return false
  }
}

// 设置宽度
function setWidth(width: boolean | number | undefined) {
  if (width === undefined || typeof width === 'boolean')
    return '200px'
  return `${width}px`
}

// 表单验证的异步函数
function formValidation(onSuccess: () => void, onError: () => void) {
  setFormRef.value?.validate((errors) => {
    if (!errors)
      onSuccess()
    else onError()
  })
}

defineExpose({ formValidation })
</script>

<template>
  <div pt7.5>
    <n-h3 prefix="bar">
      {{ title }}
    </n-h3>
    <n-form ref="setFormRef" :rules="rules">
      <n-card v-for="(item, index) in items" :key="index" mb3 wfull rounded-2 class="set-item" :content-style="{ padding: '0 20px' }">
        <div flex="~ col 1" pr font-500 text="3.8" tracking-wider>
          <div flex="~" items="center">
            {{ item.name }}
            <n-tag v-if="item.isDev" :bordered="false" round size="small" type="warning" ml1>
              开发中
              <template #icon>
                <div i-material-symbols-code />
              </template>
            </n-tag>
          </div>

          <n-text v-if="item.tip" text-xs op80>
            {{ item.tip }}
          </n-text>
        </div>
        <div
          :class="checkComponentType(item) || item.width ? 'set-item-other' : null"
          :style="`--w:${setWidth(item.width)}`"
        >
          <n-form-item :path="item.path">
            <component :is="item.component" />
          </n-form-item>
        </div>
      </n-card>
    </n-form>
  </div>
</template>

<style scoped>
.set-item :deep(.n-card__content) {
  --uno: flex flex-row items-center justify-between;
}

.set-item :deep(.n-select) {
  --uno: w50;
}

:deep(.n-form-item) > .n-form-item-feedback-wrapper {
  --uno: text-xs;
}

.set-item .set-item-other,
.set-item .set-item-other :deep(.n-select),
.set-item .set-item-other :deep(.n-input) {
  width: var(--w);
}
</style>
