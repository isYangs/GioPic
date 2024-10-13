<script setup lang="ts">
import type { TabOption } from '~/types'

defineProps<TabOption>()

const setForm = useTemplateRef('setFormRef')

// 检查组件类型是否需要设置宽度
function checkComponentType(item: any) {
  const { type, props } = item.component()
  return (type.name === 'Select' && props?.multiple !== false) || type.name === 'InputGroup'
}

// 设置宽度
function setWidth(width: boolean | number | undefined) {
  return width === undefined || typeof width === 'boolean' ? '200px' : `${width}px`
}

// 表单验证的异步函数
function formValidation(onSuccess: () => void) {
  setForm.value?.validate((errors) => {
    if (!errors)
      onSuccess()
  })
}

defineExpose({ formValidation })
</script>

<template>
  <div class="set-type pt7.5">
    <n-h3 prefix="bar">
      {{ title }}
    </n-h3>
    <n-form ref="setFormRef" :rules="rules">
      <n-card
        v-for="(item, index) in items"
        :key="index"
        class="set-item mb3 wh-full rounded-2"
        :content-style="{ padding: '0 20px' }"
      >
        <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
          <div class="flex items-center">
            {{ item.name }}
            <n-tag
              v-if="item.isDev"
              :bordered="false"
              round
              size="small"
              type="warning"
              class="ml1"
            >
              开发中
              <template #icon>
                <div i-ph-code-bold />
              </template>
            </n-tag>
          </div>
          <n-text class="text-xs op80">
            <component :is="typeof item.tip === 'string' ? 'span' : item.tip">
              {{ typeof item.tip === 'string' ? item.tip : '' }}
            </component>
          </n-text>
        </div>
        <div
          :class="{ 'set-item-other': checkComponentType(item) || item.width }"
          :style="{ '--w': setWidth(item.width) }"
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
