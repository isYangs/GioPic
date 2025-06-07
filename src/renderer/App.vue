<script setup lang="ts">
import { useAppStore, usePluginStore } from './stores'

const appStore = useAppStore()
const { isMenuCollapsed, sidebarWidth } = storeToRefs(appStore)

const pluginStore = usePluginStore()

onMounted(async () => {
  await nextTick()

  setTimeout(async () => {
    if (!pluginStore.loaded) {
      await pluginStore.loadPlugins()
    }
  }, 100)
})
</script>

<template>
  <provider>
    <n-layout has-sider class="wh-full">
      <n-layout-sider
        bordered
        collapse-mode="width"
        show-trigger="bar"
        :native-scrollbar="false"
        :collapsed-width="64"
        :width="sidebarWidth"
        :collapsed="isMenuCollapsed"
        content-class="flex flex-col h-full draggable"
        @collapse="isMenuCollapsed = true"
        @expand="isMenuCollapsed = false"
      >
        <div class="h-full flex flex-col">
          <n-layout-header bordered class="flex-shrink-0">
            <logo class="draggable" />
          </n-layout-header>
          <side-bar class="no-draggable min-h-0 flex-1" />
        </div>
      </n-layout-sider>

      <n-layout content-class="flex flex-col">
        <n-layout-header bordered>
          <title-bar />
        </n-layout-header>

        <n-layout class="pr.5" content-class="p6" :native-scrollbar="false">
          <router-view v-slot="{ Component, route }">
            <suspense>
              <template #default>
                <keep-alive :include="['Images', 'Home']">
                  <transition name="router" mode="out-in" appear>
                    <component :is="Component" :key="route.path" />
                  </transition>
                </keep-alive>
              </template>
              <template #fallback>
                <div class="h-full flex items-center justify-center">
                  <n-spin size="large" description="加载中..." />
                </div>
              </template>
            </suspense>
          </router-view>
        </n-layout>
      </n-layout>
    </n-layout>
  </provider>
</template>

<style scoped>
.router-enter-active,
.router-leave-active {
  transition: all 0.15s ease-out;
}

.router-enter-from {
  opacity: 0;
  transform: translateX(8px);
}

.router-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.router-enter-to,
.router-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>
