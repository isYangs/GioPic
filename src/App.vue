<script setup lang="ts">
import { useAppStore } from './stores'

const appStore = useAppStore()
const { isMenuCollapsed } = storeToRefs(appStore)
</script>

<template>
  <Provider>
    <n-layout has-sider class="wh-full">
      <n-layout-sider
        bordered
        collapse-mode="width"
        show-trigger="bar"
        :native-scrollbar="false"
        :collapsed-width="64"
        :width="180"
        :collapsed="isMenuCollapsed"
        content-class="flex flex-col hfull draggable"
        @collapse="isMenuCollapsed = true"
        @expand="isMenuCollapsed = false"
      >
        <n-layout-header bordered>
          <Logo class="draggable" />
        </n-layout-header>
        <Menu class="no-draggable" />
      </n-layout-sider>
      <n-layout content-class="flex flex-col">
        <n-layout-header bordered>
          <Header />
        </n-layout-header>
        <n-layout class="pr.5" content-class="p6" :native-scrollbar="false">
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
