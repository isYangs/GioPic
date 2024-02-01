<script setup lang="ts">
import { useAppStore } from '~/stores'
import bgImg from '~/assets/background.jpg'

const appStore = useAppStore()
const { bgImgUrl, recordSavePath } = storeToRefs(appStore)

if (recordSavePath.value) {
  window.ipcRenderer.send('get-ur-file', recordSavePath.value)
}

const handleSettingsDrawer = () => {
  appStore.setState({ isSettingsDrawer: true })
}

const handleUploadRecord = () => {
  appStore.setState({ isUploadRecord: true })
}

onBeforeMount(() => {
  appStore.setState({ isSettingsDrawer: false }) // 防止保存时出现错误，在挂载时重置设置面板的显示状态
})
</script>

<template>
  <div class="wfull hscreen absolute top-0 left-0 overflow-hidden select-none -z-10">
    <img class="wh-full object-cover object-center" :src="bgImgUrl || bgImg" />
  </div>
  <div class="wfull max-h-screen overflow-x-hidden overflow-y-auto">
    <div class="wh-full select-none">
      <div class="wh-full">
        <Header />
        <main class="wh-full py5 flex-center flex-col px20">
          <Upload />
          <ImageList />
        </main>
        <Footer />
      </div>
      <div class="flex-col fixed bottom-20% right-20px cursor-pointer">
        <WidgetsButton ic="i-mi-settings" @click="handleSettingsDrawer" />
        <WidgetsButton ic="i-material-symbols-event-note-outline" @click="handleUploadRecord" />
      </div>
    </div>
  </div>
  <SettingsPanel />
  <UploadRecord />
</template>

<style scoped></style>
