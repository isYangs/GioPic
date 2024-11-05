<script setup lang="ts">
const appStore = useAppStore()
const router = useRouter()
const { isMenuCollapsed } = storeToRefs(appStore)

// router.beforeEach((to, from, next) => {

// })

onMounted(() => {
  routerPush(router)
})
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
        <n-layout content-class="wh-full" :native-scrollbar="false">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <Transition name="router" mode="out-in">
                <component :is="Component" class="p6" />
              </Transition>
            </keep-alive>
          </router-view>
        </n-layout>
      </n-layout>
    </n-layout>
  </Provider>
</template>
