<script setup lang="ts">
const collapsed = ref(false)
</script>

<template>
  <Provider wh-full>
    <n-layout has-sider wh-full>
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <Menu :collapsed="collapsed" />
      </n-layout-sider>
      <n-layout>
        <n-layout-header>颐和园路</n-layout-header>
        <n-layout-content content-style="padding: 24px;">
          <RouterView />
        </n-layout-content>
        <n-layout-footer>成府路</n-layout-footer>
      </n-layout>
    </n-layout>
  </Provider>
</template>

<style scoped></style>
