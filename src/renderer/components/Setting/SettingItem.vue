<script setup lang="ts">
defineProps<{
  title?: string
  desc?: string
  isDev?: boolean
}>()
</script>

<template>
  <n-card class="set-item mb3 wh-full rounded-2">
    <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
      <div class="flex items-center">
        <slot name="title">
          {{ title }}
        </slot>
        <n-tag
          v-if="isDev"
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
        <slot name="desc">
          {{ desc }}
        </slot>
      </n-text>
    </div>
    <slot />
  </n-card>
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
