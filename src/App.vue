<script setup lang="ts">
import { useAppStore } from './stores'
import { routerPush } from './utils'

const appStore = useAppStore()
const router = useRouter()
const route = useRoute()
const { isMenuCollapsed, isDevToolsOpen } = storeToRefs(appStore)

// router.beforeEach((to, from, next) => {

// })

window.ipcRenderer.invoke('devtools', isDevToolsOpen.value)

const showDialogUpdateProgress = ref(false)
const updateProgress = ref(0)

window.ipcRenderer.on('update', (_e, type, ...args) => {
  switch (type) {
    case 'show-toast':
      window.ipcRenderer.invoke('window-show')
      window.$message.info(args[0])
      break
    case 'show-update-progress':
      showDialogUpdateProgress.value = true
      break
    case 'update-update-progress':
      updateProgress.value = args[0]
      break
  }
})

onMounted(() => {
  routerPush(router)
})
</script>

<template>
  <Provider>
    <UpdateProgress v-if="showDialogUpdateProgress" v-model="showDialogUpdateProgress" :percentage="updateProgress" />
    <n-layout position="absolute">
      <n-layout-header bordered>
        <MainNav />
      </n-layout-header>
      <n-layout
        has-sider
        position="absolute"
        style="top:61px; bottom:0; overflow: auto;"
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
        <n-layout content-style="padding: 24px;" :native-scrollbar="false">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <Transition name="router" mode="out-in">
                <component :is="Component" />
              </Transition>
            </keep-alive>
          </router-view>
        </n-layout>
      </n-layout>
    </n-layout>
  </Provider>
</template>
