<script setup lang="ts">
defineProps<{
  title?: string
  desc?: string
}>()
</script>

<template>
  <n-card class="set-item mb3 wh-full rounded-2">
    <div class="text-3.8 font-500 tracking-wider">
      <slot name="title">
        {{ title }}
      </slot>

      <n-text class="block text-xs op80">
        <slot name="desc">
          {{ desc }}
        </slot>
      </n-text>
    </div>

    <slot />
  </n-card>
</template>

<style scoped>
.set-item :deep(:is(.n-card-content, .n-card__content)) {
  --uno: flex flex-row gap-4 items-center justify-between;
}

.set-item :deep(:is(.n-select, .n-color-picker)) {
  --uno: w50;
}

.set-item :deep(.n-input) {
  --uno: w75;
}
</style>
