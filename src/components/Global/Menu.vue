<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import { RouterLink } from 'vue-router/auto'
import { useAppStore } from '~/stores'

const appStroe = useAppStore()
const { isMenuCollapsed } = storeToRefs(appStroe)
const router = useRouter()
const menuActiveKey = ref(router.currentRoute.value.path ?? '/')
console.log(router.options.routes)

watch(
  () => router.currentRoute.value.path,
  (path) => {
    menuActiveKey.value = path
  },
)

function renderIcon(icon: string) {
  return () => h('div', { class: `${icon} ` })
}

const menuOptions = computed((): MenuOption[] => [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: 'Home',
          },
        },
        { default: () => '首页' },
      ),
    key: '/',
    icon: renderIcon('i-ic-sharp-house !w24px !h24px'),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: '/LskyPro/',
          },
        },
        { default: () => '兰空图床' },
      ),
    key: '/LskyPro',
    icon: renderIcon('i-ic-baseline-photo'),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: '/Images/',
          },
        },
        { default: () => '图片广场' },
      ),
    key: '/Images',
    icon: renderIcon('i-ic-baseline-photo-library'),
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: '/Setting/',
          },
        },
        { default: () => '程序设置' },
      ),
    key: '/Setting',
    icon: renderIcon('i-ic-sharp-settings'),
  },
])

function handleUpdateValue(value: string) {
  router.push(value)
}
</script>

<template>
  <n-menu
    v-model:value="menuActiveKey"
    :options="menuOptions"
    :collapsed="isMenuCollapsed"
    :collapsed-width="64"
    :collapsed-icon-size="22"
    :indent="22"
    @update:value="handleUpdateValue"
  />
</template>

<style scoped>
:deep(.n-menu-item-content.n-menu-item-content--selected)::before {
  border-left: 4px solid var(--n-item-text-color-active);
}
</style>
