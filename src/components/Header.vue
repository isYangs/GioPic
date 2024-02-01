<script setup lang="ts">
import { useAppStore, useUserStore } from '~/stores'

const appStore = useAppStore()
const userStore = useUserStore()
const { apiUrl, apiUrlTitle } = storeToRefs(appStore)
const { name, getCacpacity, getSize, imageNum } = storeToRefs(userStore)
</script>

<template>
  <div class="px20">
    <h2 class="text-3xl font-base my8">欢迎你，{{ name ? name : '陌生人' }}！</h2>
    <n-alert title="提示" type="info">
      <span class="font-500">
        你在
        <a :href="apiUrl" target="_blank" rel="noopener noreferrer"
          >{{ apiUrlTitle }} <span class="i-ic-round-open-in-new w4 h4"></span
        ></a>
        的空间总容量为 {{ getCacpacity }}，已使用 {{ getSize }}，共上传了
        <n-number-animation :from="0" :to="imageNum" /> 张图片
      </span>
    </n-alert>
  </div>
</template>
