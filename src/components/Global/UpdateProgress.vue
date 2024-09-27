<script setup lang="ts">
defineProps<{
  percentage: number
}>()

const showDialogUpdateProgress = defineModel('showDialogUpdateProgress')

const dialogShow = ref(true)

function close() {
  dialogShow.value = false
  showDialogUpdateProgress.value = false
}

onBeforeUnmount(() => {
  console.log('我要死了')
})
</script>

<template>
  <n-modal
    v-model:show="dialogShow"
    :auto-focus="false"
    :mask-closable="false"
    :bordered="false"
    :close-on-esc="false"
    :closable="false"
    preset="card"
    title="下载进度"
    transform-origin="center"
  >
    <n-space vertical>
      <n-progress type="line" :percentage indicator-placement="inside" />
    </n-space>

    <template #footer>
      <n-flex justify="space-between">
        <n-button strong secondary :focusable="false" @click="close">
          关闭
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>
