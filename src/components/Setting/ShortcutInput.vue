<script setup lang="ts">
import { NInput } from 'naive-ui'

const props = defineProps<{
  value: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const keys = ref<string[]>(props.value ? props.value.split('+') : [])

// 按键映射表
const keyMap: { [key: string]: string } = {
  Meta: 'Cmd',
  Control: 'Ctrl',
  Alt: 'Option',
  Shift: 'Shift',
}

const displayValue = computed(() =>
  keys.value.map(key => keyMap[key] || key.toUpperCase()).join(' + '),
)

watch(keys, (newKeys) => {
  emit('update:value', newKeys.join('+'))
})

const message = useMessage()

// 检测操作系统
const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const modifierKeys = isMac ? ['Cmd', 'Ctrl', 'Option', 'Shift'] : ['Ctrl', 'Alt', 'Shift']

function addKey(key: string) {
  if (keys.value.length === 0) {
    // 第一个按键必须是 keyMap 中的键
    if (keyMap[key])
      keys.value.push(key)
    else
      message.warning(`第一个按键必须是 ${modifierKeys.join('、')} 键。`)
  }
  else if (!keys.value.includes(key) && keys.value.length < 3) {
    // 如果按键在 keyMap 中，使用原值，否则转换为大写
    const normalizedKey = keyMap[key] ? key : key.toUpperCase()
    keys.value.push(normalizedKey)
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (event.isComposing)
    return

  event.preventDefault()
  const key = event.key

  if (event.key === 'Backspace')
    keys.value.pop()
  else
    addKey(key)
}

function onCompositionEnd(event: CompositionEvent) {
  const key = event.data
  addKey(key)
}

function clearKeys() {
  keys.value = []
}
</script>

<template>
  <NInput
    :value="displayValue"
    :placeholder="placeholder"
    clearable
    @keydown.prevent="onKeyDown"
    @compositionend="onCompositionEnd"
    @clear="clearKeys"
  />
</template>

<style scoped>
/* 可以根据需要添加样式 */
</style>
