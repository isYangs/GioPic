<script setup lang="ts">
import Logo from '~/assets/logo.svg'
import { useAppStore } from '~/stores'
import { renderIcon } from '~/utils'

const appStore = useAppStore()
const { isMenuCollapsed, themeAuto, themeType } = storeToRefs(appStore)
const router = useRouter()

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
      // window.ipcRenderer.invoke('opne-about')
      router.push('/About')
      break
    }
    default:
      break
  }
}
</script>

<template>
  <nav class="h15 wfull flex select-none items-center" style="-webkit-app-region: drag;">
    <div class="flex cursor-pointer items-center" :class="isMenuCollapsed ? null : 'w60'" @click="router.push('/')">
      <div class="hfull w16 flex flex-center" style="-webkit-app-region: no-drag">
        <n-avatar
          size="medium"
          :src="Logo"
          style="--n-color: transparent"
        />
      </div>
      <h1 v-if="!isMenuCollapsed" class="text-2xl font-600" style="-webkit-app-region: no-drag">
        GioPic
      </h1>
    </div>
    <div class="flex items-center gap1" style="-webkit-app-region: no-drag">
      <n-button :focusable="false" quaternary class="h8 w8 rounded-1.5" @click="router.go(-1)">
        <template #icon>
          <div i-ph-caret-left-bold />
        </template>
      </n-button>
      <n-button :focusable="false" quaternary class="h8 w8 rounded-1.5" @click="router.go(1)">
        <template #icon>
          <div i-ph-caret-right-bold />
        </template>
      </n-button>
    </div>

    <div class="mla flex" style="-webkit-app-region: no-drag">
      <div>
        <n-dropdown :options="themeOptions" trigger="click" @select="themeChange">
          <n-button :focusable="false" quaternary class="h8 w8">
            <template #icon>
              <div i-ph-gear-six-bold />
            </template>
          </n-button>
        </n-dropdown>
      </div>
      <TitleBar />
    </div>
  </nav>
</template>
