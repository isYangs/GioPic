<script setup lang="ts">
import Logo from '~/assets/logo.svg'
import { useAppStore } from '~/stores'

const appStroe = useAppStore()
const { isMenuCollapsed, themeAuto, themeType } = storeToRefs(appStroe)
const router = useRouter()

function renderIcon(icon: string) {
  return () => h('div', { class: `${icon} ` })
}

const themeOptions = computed(() => [
  {
    label: themeType.value === 'light' ? '浅色模式' : '深色模式',
    key: 'lightTodark',
    icon: renderIcon(themeType.value === 'light' ? 'i-material-symbols-light-mode' : 'i-material-symbols-dark-mode'),
  },
  {
    label: '程序设置',
    key: 'setting',
    icon: renderIcon('i-material-symbols-settings-rounded'),
  },
])

function handleThemeChange(key: string) {
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
    default:
      break
  }
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
      <h1 v-if="!isMenuCollapsed" text-2xl font-600 style="-webkit-app-region: no-drag">
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
              <div i-icon-park-outline-setting-two />
            </template>
          </n-button>
        </n-dropdown>
      </div>
      <TitleBar />
    </div>
  </nav>
</template>
