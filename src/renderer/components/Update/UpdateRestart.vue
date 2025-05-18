<script setup lang="ts">
import { useAppStore } from '~/stores'

defineProps<{
  forceUpdate: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const appStore = useAppStore()
const { updateAtNext } = storeToRefs(appStore)

function onConfirmUpdate(action: 'update' | 'cancel') {
  const actions = {
    update: () => {
      window.ipcRenderer.send('restart-and-install')
      emit('close')
    },
    cancel: () => {
      updateAtNext.value = true
      emit('close')
    },
  }
  actions[action]()
}
</script>

<template>
  <div class="mb6">
    <n-text>
      新版本已下载完成，是否立即重启？
    </n-text>
  </div>
  <n-flex align="center" justify="end">
    <n-flex>
      <n-button v-if="!forceUpdate" strong secondary :focusable="false" @click="onConfirmUpdate('cancel')">
        稍后重启
      </n-button>
      <n-button type="primary" :focusable="false" strong secondary @click="onConfirmUpdate('update')">
        立即重启
      </n-button>
    </n-flex>
  </n-flex>
</template>
