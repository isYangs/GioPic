<script setup lang="ts">
const uploadData = ref<GP.DB.UplaodData[]>([])

onMounted(() => {
  window.ipcRenderer.send('get-uploadData')
})

window.ipcRenderer.on('get-uploadData-status', (_e, data) => {
  uploadData.value = data
  console.log(uploadData)
})
</script>

<template>
  <div>
    <n-grid v-show="uploadData.length > 0" :cols="4" :x-gap="16" :y-gap="16">
      <n-grid-item v-for="item in uploadData" :key="item.key">
        <n-card :title="item.key" :bordered="false">
          <n-image :src="item.url" />
        </n-card>
        <n-button type="error">
          删除
        </n-button>
      </n-grid-item>
    </n-grid>
    <n-empty v-if="uploadData.length === 0" mt40 size="large" description="还没有图片，快去上传图片吧">
      <template #icon>
        <div i-icon-park-outline-error-picture h11 w11 />
      </template>
    </n-empty>
  </div>
</template>

<style scoped></style>
