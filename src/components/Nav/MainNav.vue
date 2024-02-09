<script setup lang="ts">
import Logo from '~/assets/logo.svg'
import { useAppStore } from '~/stores'

const appStroe = useAppStore()
const { isMenuCollapsed, themeAuto, themeType } = storeToRefs(appStroe)
const router = useRouter()

const themeOptions = [
  {
    label: '浅色主题',
    key: 'light',
    icon() {
      return h('div', { class: 'i-material-symbols-light-mode' })
    },
  },
  {
    label: '深色主题',
    key: 'dark',
    icon() {
      return h('div', { class: 'i-material-symbols-dark-mode' })
    },
  },
]

function handleThemeChange(type: 'light' | 'dark') {
  themeAuto.value = false
  themeType.value = type
}
</script>

<template>
  <nav flex="~" h15 wfull select-none items-center style="-webkit-app-region: drag;">
    <div flex="~" cursor-pointer items-center :class="isMenuCollapsed ? null : 'w60'" @click="router.push('/')">
      <div hfull w16 flex="~ center" style="-webkit-app-region: no-drag">
        <n-avatar
          size="medium"
          :src="Logo"
          hover="transform scale-120 transition-transform duration-500"
          style="--n-color: transparent"
        />
      </div>
      <h1 v-if="!isMenuCollapsed" text-2xl font-600 font-sans style="-webkit-app-region: no-drag">
        GioPic
      </h1>
    </div>
    <div flex="~" items-center style="-webkit-app-region: no-drag">
      <n-button :focusable="false" quaternary mr2 h8 w8 rounded-1.5 @click="router.go(-1)">
        <template #icon>
          <div i-tabler-chevron-left />
        </template>
      </n-button>
      <n-button :focusable="false" quaternary h8 w8 @click="router.go(1)">
        <template #icon>
          <div i-tabler-chevron-right />
        </template>
      </n-button>
    </div>

    <div mla flex="~" style="-webkit-app-region: no-drag">
      <div>
        <n-dropdown :options="themeOptions" trigger="click" @select="handleThemeChange">
          <n-button :focusable="false" quaternary h8 w8>
            <template #icon>
              <div i-mdi-theme-light-dark />
            </template>
          </n-button>
        </n-dropdown>
      </div>
      <TitleBar />
    </div>
  </nav>
</template>
