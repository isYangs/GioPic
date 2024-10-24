<script setup lang="ts">
import { useAppStore } from '~/stores'

const props = defineProps<{
  releaseVersion: string
  releaseContent: string
}>()

const appStore = useAppStore()
const { ignoreVersion } = storeToRefs(appStore)
const showModal = defineModel<boolean>()
const ignoreThisVersion = ref(false)
function onConfirmUpdate(action: 'update' | 'ignore') {
  const actions = {
    update: () => {
      window.ipcRenderer.send('download-update')
      showModal.value = false
    },
    ignore: () => {
      if (ignoreThisVersion.value) {
        ignoreVersion.value = props.releaseVersion
      }
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
    :title="`新版本：${releaseVersion}`"
    transform-origin="center"
  >
    <div class="mb4 whitespace-pre-wrap text-4">
      {{ releaseContent }}
    </div>

    <template #footer>
      <n-flex align="center" justify="space-between">
        <n-checkbox v-model:checked="ignoreThisVersion">
          记住且不再询问
        </n-checkbox>
        <n-flex>
          <n-button type="primary" :focusable="false" strong secondary @click="onConfirmUpdate('update')">
            下载更新
          </n-button>
          <n-button strong secondary :focusable="false" @click="onConfirmUpdate('ignore')">
            暂不更新
          </n-button>
        </n-flex>
      </n-flex>
    </template>
  </n-modal>
</template>
