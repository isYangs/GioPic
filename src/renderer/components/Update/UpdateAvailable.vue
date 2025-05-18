<script setup lang="ts">
import { useAppStore } from '~/stores'

const props = defineProps<{
  releaseVersion: string
  releaseContent: string
}>()

const emit = defineEmits<{
  close: []
}>()

const appStore = useAppStore()
const { ignoreVersion } = storeToRefs(appStore)
const ignoreThisVersion = ref(false)

function onConfirmUpdate(action: 'update' | 'ignore') {
  const actions = {
    update: () => {
      window.ipcRenderer.send('download-update')
      emit('close')
    },
    ignore: () => {
      if (ignoreThisVersion.value) {
        ignoreVersion.value = props.releaseVersion
      }
      emit('close')
    },
  }

  actions[action]()
}
</script>

<template>
  <div class="mb6 whitespace-pre-wrap text-4">
    {{ releaseContent }}
  </div>
  <n-flex align="center" justify="space-between">
    <n-checkbox v-model:checked="ignoreThisVersion">
      忽略此版本
    </n-checkbox>
    <n-flex>
      <n-button strong secondary :focusable="false" @click="onConfirmUpdate('ignore')">
        暂不更新
      </n-button>
      <n-button type="primary" :focusable="false" strong secondary @click="onConfirmUpdate('update')">
        下载更新
      </n-button>
    </n-flex>
  </n-flex>
</template>
