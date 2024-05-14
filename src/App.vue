<script setup lang="ts">
import { useAppStore } from './stores'
import { routerPush } from './utils'

const appStroe = useAppStore()
const router = useRouter()
const { isMenuCollapsed } = storeToRefs(appStroe)

// router.beforeEach((to, from, next) => {

// })

onMounted(() => {
  routerPush(router)
})
</script>

<template>
  <Provider>
    <n-layout position="absolute" :class="{ height: '100%' }">
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
