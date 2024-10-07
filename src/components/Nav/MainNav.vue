<script setup lang="ts">
import { useAppStore } from '~/stores'
import { renderIcon } from '~/utils'

const appStore = useAppStore()
const { isMenuCollapsed, themeAuto, themeType } = storeToRefs(appStore)
const route = useRoute()
const router = useRouter()

const canGoBack = ref(false)
const canGoForward = ref(false)
watch(() => route.fullPath, () => {
  canGoBack.value = !!window.history.state.back
  canGoForward.value = !!window.history.state.forward
})

const themeOptions = computed(() => [
  {
    label: themeType.value === 'light' ? '深色模式' : '浅色模式',
    key: 'lightTodark',
    icon: renderIcon(themeType.value === 'light' ? 'i-ph-moon-stars-bold' : 'i-ph-sun-bold'),
  },
  {
    label: '程序设置',
    key: 'setting',
    icon: renderIcon('i-ph-gear-six-bold'),
  },
  {
    label: '关于',
    key: 'about',
    icon: renderIcon('i-ph-info-bold'),
  },
])

function themeChange(key: string) {
  switch (key) {
    case 'lightTodark': {
      themeType.value = themeType.value === 'dark' ? 'light' : 'dark'
      window.$message.info(`已切换至${themeType.value === 'light' ? '浅色' : '深色'}模式`, { showIcon: false })
      themeAuto.value = false
      break
    }
    case 'setting': {
      router.push('/Setting')
      break
    }
    case 'about': {
      router.push('/About')
      break
    }
    default:
      break
  }
}
</script>

<template>
  <nav class="h9 wfull flex select-none items-center" style="-webkit-app-region: drag;">
    <div class="flex cursor-pointer items-center" :class="isMenuCollapsed ? 'w16' : 'w60'">
      <div class="mx4 hfull flex-center gap-1.5" style="-webkit-app-region: no-drag" @click="router.push('/')">
        <Logo class="w5" />
        <h1 v-if="!isMenuCollapsed" class="font-type text-lg">
          GioPic
        </h1>
      </div>
    </div>
    <div class="flex flex-1 justify-between">
      <div class="flex items-center gap1" style="-webkit-app-region: no-drag">
        <n-button :focusable="false" quaternary class="h6 w6 rounded-1.5" :disabled="!canGoBack" @click="router.go(-1)">
          <template #icon>
            <div i-ph-caret-left-bold />
          </template>
        </n-button>
        <n-button v-if="canGoForward" :focusable="false" quaternary class="h6 w6 rounded-1.5" @click="router.go(1)">
          <template #icon>
            <div i-ph-caret-right-bold />
          </template>
        </n-button>
      </div>

      <div style="-webkit-app-region: no-drag" class="flex-center">
        <n-dropdown :options="themeOptions" trigger="click" @select="themeChange">
          <n-button :focusable="false" quaternary class="h6 w6">
            <template #icon>
              <div i-ph-gear-six-bold />
            </template>
          </n-button>
        </n-dropdown>
        <TitleBar />
      </div>
    </div>
  </nav>
</template>
