<script setup lang="ts">
defineProps<{
  forceUpdate: boolean
}>()

const appStore = useAppStore()
const { updateAtNext } = storeToRefs(appStore)

const showModal = defineModel<boolean>()
function onConfirmUpdate(action: 'update' | 'cancel') {
  const actions = {
    update: () => {
      window.ipcRenderer.send('restart-and-install')
      showModal.value = false
    },
    cancel: () => {
      updateAtNext.value = true
      showModal.value = false
    },
  }
  actions[action]()
}
</script>

<template>
  <n-modal
    v-model:show="showModal"
    :auto-focus="false"
    :mask-closable="false"
    :bordered="false"
    :close-on-esc="false"
    :closable="false"
    preset="card"
    title="更新下载完成"
    transform-origin="center"
  >
    <n-text>
      新版本已下载完成，是否立即重启？
    </n-text>
    <template #footer>
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
  </n-modal>
</template>
