<script setup lang="ts">
import { useAppStore } from './stores'

const appStroe = useAppStore()
const { isMenuCollapsed } = storeToRefs(appStroe)
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
        <n-layout :native-scrollbar="false" embedded p6>
          <RouterView v-slot="{ Component }">
            <Transition name="run" mode="out-in">
              <component :is="Component" />
            </Transition>
          </RouterView>
        </n-layout>
      </n-layout>
    </n-layout>
  </Provider>
</template>
