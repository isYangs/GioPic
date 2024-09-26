<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  noMetaMap?: boolean
}>()

const slots = defineSlots()

const isMac = computed(() => navigator.userAgent.includes('Mac OS'))
const delimiter = computed(() => isMac.value ? ' ' : '+')

const modifierMap = computed(() => ({
  ctrl: isMac.value ? props.noMetaMap ? '⌃' : '⌘' : 'Ctrl',
  shift: isMac.value ? '⇧' : 'Shift',
  alt: isMac.value ? '⌥' : 'Alt',
  meta: isMac.value ? '⌘' : 'Meta',
}))

const display = computed(() => {
  const modifiers = []
  if (props.ctrl)
    modifiers.push(modifierMap.value.ctrl)
  if (props.shift)
    modifiers.push(modifierMap.value.shift)
  if (props.alt)
    modifiers.push(modifierMap.value.alt)
  if (props.meta)
    modifiers.push(modifierMap.value.meta)
  if (slots.default)
    modifiers.push([])
  return modifiers.join(delimiter.value)
})
</script>

<template>
  <div class="keycut mx.5 inline-block border-rd px1 py.5 text-[.9em] line-height-none tracking-tight">
    {{ display }}<slot />
  </div>
</template>

<style scoped>
.keycut {
  background-color: var(--n-border-color);
}
</style>
