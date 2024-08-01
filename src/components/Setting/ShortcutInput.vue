<script setup lang="ts">
const props = defineProps<{
  value: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'updateValue', value: string): void
}>()

const shortcut = ref(false)
const modalKeys = ref<string[]>([])
const keys = ref<string[]>(props.value ? props.value.split('+') : [])
const pressedKeys = ref<Set<string>>(new Set())
const message = useMessage()
const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const modifierKeys = isMac ? ['Meta', 'Control', 'Alt', 'Shift'] : ['Control', 'Alt', 'Shift']
const keyMap: { [key: string]: string } = {
  Meta: 'Cmd',
  Control: 'Ctrl',
  Alt: 'Option',
  Shift: 'Shift',
}

const displayValue = computed(() =>
  keys.value.map(key => keyMap[key] || key.toUpperCase()).join(' + '),
)

const modalDisplayValue = computed(() =>
  modalKeys.value.map(key => keyMap[key] || key.toUpperCase()).join(' + '),
)

// 添加按键到序列中
function addKey(key: string, targetKeys: string[]) {
  const isModifierKey = keyMap[key]
  const isLetterOrSymbol = /^[a-zA-Z0-9]$/.test(key) || /^[\p{P}\p{S}]$/u.test(key)

  if (targetKeys.length === 0) {
    if (isModifierKey)
      targetKeys.push(key)
    else
      message.warning(`第一个键必须为${modifierKeys.join('、')}键`)
  }
  else if (targetKeys.length === 1) {
    if (isLetterOrSymbol) {
      const normalizedKey = keyMap[key] ? key : key.toUpperCase()
      targetKeys.push(normalizedKey)
    }
    else {
      message.warning(`第二个键必须为字母或符号`)
    }
  }
}

// 处理键盘按下
function onKeyDown(event: KeyboardEvent, targetKeys: string[]) {
  if (event.isComposing)
    return

  let key = event.key
  // 在 Windows 系统上将 Meta 键映射到 Ctrl 键
  if (!isMac && key === 'Meta')
    key = 'Control'

  event.preventDefault()
  pressedKeys.value.add(key)

  // 检查是否同时按下修饰键和字母/符号键
  if (pressedKeys.value.size === 2) {
    const keysArray = Array.from(pressedKeys.value)
    const modifierKey = keysArray.find(key => keyMap[key])
    const letterOrSymbolKey = keysArray.find(key => /^[a-zA-Z0-9]$/.test(key) || /^[\p{P}\p{S}]$/u.test(key))

    if (modifierKey && letterOrSymbolKey) {
      addKey(modifierKey, targetKeys)
      addKey(letterOrSymbolKey, targetKeys)
      pressedKeys.value.clear()
    }
  }
  else if (key === 'Backspace') {
    targetKeys.length = 0
  }
}

// 处理键盘弹起
function onKeyUp(event: KeyboardEvent) {
  pressedKeys.value.delete(event.key)
}

function clearKeys(targetKeys: string[]) {
  targetKeys.length = 0
}

function openShortcut() {
  modalKeys.value = [...keys.value]
  shortcut.value = true
}

function closeShortcut() {
  shortcut.value = false
}

async function checkAndSaveShortcut() {
  const shortcut = modalKeys.value.join('+')
  const isRegistered = await window.ipcRenderer.invoke('check-shortcut', shortcut)

  if (isRegistered) {
    message.warning('该快捷键已被占用，请选择其他快捷键')
  } else {
    keys.value = [...modalKeys.value]
    emit('updateValue', keys.value.join('+'))
    closeShortcut()
  }
}

watch(keys, (newKeys) => {
  emit('updateValue', newKeys.join('+'))
}, { deep: true })
</script>

<template>
  <n-input-group>
    <n-input
      :disabled="true"
      :value="displayValue"
      :placeholder="placeholder"
      class="text-center !w28"
    />
    <n-button @click="openShortcut">
      <div class="i-codicon-record-keys" />
    </n-button>
  </n-input-group>

  <n-modal
    v-model:show="shortcut"
    :auto-focus="false"
    :mask-closable="false"
    :bordered="false"
    :close-on-esc="false"
    :closable="false"
    preset="card"
    title="快捷键设置"
    transform-origin="center"
  >
    <div class="ma mb2 max-w-100 text-4">
      <n-input
        class="text-center"
        :value="modalDisplayValue"
        :placeholder="placeholder"
        clearable
        @keydown.prevent="onKeyDown($event, modalKeys)"
        @keyup="onKeyUp"
        @clear="clearKeys(modalKeys)"
      />
    </div>
    <template #footer>
      <n-flex justify="space-between">
        <n-button strong secondary :focusable="false" @click="closeShortcut">
          取消
        </n-button>
        <n-button type="primary" :focusable="false" strong secondary @click="checkAndSaveShortcut">
          保存
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
