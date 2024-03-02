<script setup lang="ts">
import { useAppStore } from './stores'

const appStroe = useAppStore()
// const router = useRouter()
const { isMenuCollapsed, recordSavePath } = storeToRefs(appStroe)

window.ipcRenderer.on('get-default-ur-file-path-reply', (_e, path) => {
  recordSavePath.value = path
})

// 设置默认的上传记录文件存储路径
if (!recordSavePath.value)
  window.ipcRenderer.send('get-default-ur-file-path')

// router.beforeEach((to, from, next) => {

// })
</script>

<template>
  <Provider>
    <n-layout hfull>
      <n-layout-header bordered>
        <MainNav />
      </n-layout-header>
      <n-layout
        has-sider wh-full position="absolute"
        style="top:61px;"
      >
        <n-layout-sider
          bordered
          collapse-mode="width"
          show-trigger="bar"
          :native-scrollbar="false"
          :collapsed-width="64"
          :width="240"
          :collapsed="isMenuCollapsed"
          @collapse="isMenuCollapsed = true"
          @expand="isMenuCollapsed = false"
        >
          <Menu />
        </n-layout-sider>
        <n-layout :native-scrollbar="false" class="hscreen" embedded>
          <n-scrollbar style="height: calc(100vh - 60px);">
            <RouterView v-slot="{ Component }" wh-full px6 pt6>
              <Transition name="run" mode="out-in">
                <component :is="Component" />
              </Transition>
            </RouterView>
          </n-scrollbar>
        </n-layout>
      </n-layout>
    </n-layout>
  </Provider>
</template>
