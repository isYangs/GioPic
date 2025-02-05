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

// 添加 resetValidation 方法
function resetValidation() {
  if (setForm.value)
    setForm.value.restoreValidation()
}

// 暴露方法给父组件
defineExpose({
  formValidation,
  resetValidation,
})
</script>

<template>
  <div class="set-type">
    <n-h3 v-if="title" prefix="bar">
      {{ title }}
    </n-h3>
    <n-form ref="setFormRef" :rules="rules">
      <setting-item
        v-for="(item, index) in items"
        :key="index"
        class="set-item mb3 wh-full rounded-2"
        :title="item.name"
        :is-dev="item.isDev"
      >
        <template #desc>
          <component :is="typeof item.tip === 'string' ? 'span' : item.tip">
            {{ typeof item.tip === 'string' ? item.tip : '' }}
          </component>
        </template>
        <div
          :class="{ 'set-item-other': checkComponentType(item) || item.width }"
          :style="{ '--w': setWidth(item.width) }"
        >
          <component :is="item.component" />
        </div>
      </setting-item>
    </n-form>
  </div>
</template>

<style scoped>
.set-item .set-item-other,
.set-item .set-item-other :deep(.n-select),
.set-item .set-item-other :deep(.n-input) {
  width: var(--w);
}
</style>
