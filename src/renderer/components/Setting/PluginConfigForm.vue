<script setup lang="ts">
import type { SettingItem } from '@giopic/core'

interface Props {
  modelValue: Record<string, any>
  settingItems: SettingItem[]
  pluginId: string
  programId?: number
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

function updateField(field: string, value: any) {
  formData.value = {
    ...formData.value,
    [field]: value,
  }
}

function getFieldValue(field: string) {
  return formData.value[field]
}
</script>

<template>
  <template v-for="item in settingItems" :key="item.field">
    <setting-item
      :title="item.label"
      :desc="item.description"
    >
      <template #title>
        <div class="flex items-center gap-1">
          <span>{{ item.label }}</span>
          <span v-if="item.required" class="text-red-500">*</span>
        </div>
      </template>

      <code-input
        v-if="item.type === 'text'"
        :value="getFieldValue(item.field)"
        :placeholder="item.placeholder"
        @update:value="updateField(item.field, $event)"
      />

      <n-input-number
        v-else-if="item.type === 'number'"
        :value="getFieldValue(item.field)"
        :placeholder="item.placeholder"
        @update:value="updateField(item.field, $event)"
      />

      <n-select
        v-else-if="item.type === 'select'"
        :value="getFieldValue(item.field)"
        :options="item.options"
        :placeholder="item.placeholder"
        @update:value="updateField(item.field, $event)"
      />

      <n-switch
        v-else-if="item.type === 'switch'"
        :value="getFieldValue(item.field)"
        :round="false"
        @update:value="updateField(item.field, $event)"
      />

      <custom-selector
        v-else-if="item.type === 'custom-selector'"
        :model-value="getFieldValue(item.field)"
        :plugin-id="pluginId"
        :custom-method="item.customMethod || ''"
        :config="formData"
        :field="item.field"
        :placeholder="item.placeholder"
        :data-key="item.dataKey"
        :label-field="item.labelField"
        :value-field="item.valueField"
        :label-format="item.labelFormat"
        :multiple="item.multiple"
        :program-id="programId"
        @update:model-value="updateField(item.field, $event)"
      />
    </setting-item>
  </template>
</template>
