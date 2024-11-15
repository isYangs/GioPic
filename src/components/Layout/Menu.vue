<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import { NButton } from 'naive-ui'
import { RouterLink } from 'vue-router/auto'

const router = useRouter()
const appStore = useAppStore()
const { isMenuCollapsed } = storeToRefs(appStore)
const menuActiveKey = ref(router.currentRoute.value.path ?? '/')

const userStorageList = ref({
  label: () =>
    h('div', { class: 'text-neutral-500 text-xs flex justify-between items-center pr5' }, [
      h('span', { class: '' }, ['创建的存储']),
      h(NButton, {
        class: 'w9 h5',
        size: 'small',
        type: 'tertiary',
        round: true,
        strong: true,
        secondary: true,
        renderIcon: renderIcon('i-ic-sharp-add !w16px !h16px'),
        onClick: () => {
          router.push('/Setting/')
        },
      }),
    ]),
  key: 'user-storage',
  children: [] as MenuOption[],
})

const menuOptions = computed(() => [
  {
    type: 'group',
    label: '我的图片',
    key: 'mian',
    children: [],
    show: !isMenuCollapsed.value,
  },
  {
    label: () =>
      h(RouterLink, {
        to: {
          name: 'Home',
        },
      }, { default: () => '上传图片' }),
    key: '/',
    icon: renderIcon('i-ph-upload-simple-bold w20px h20px'),
  },
  {
    label: () =>
      h(RouterLink, {
        to: {
          name: '/Images/',
        },
      }, { default: () => '图片列表' }),
    key: '/Images',
    icon: renderIcon('i-ph-list-bullets-bold w20px h20px'),
  },
  {
    key: 'divider-1',
    type: 'divider',
  },
  {
    ...userStorageList.value,
    show: !isMenuCollapsed.value,
  },
])

watch(
  () => router.currentRoute.value.path,
  (path) => {
    menuActiveKey.value = path
  },
)

function updateValue(value: string) {
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
    :default-expanded-keys="['user-storage']"
    :indent="22"
    @update:value="updateValue"
  />
</template>

<style scoped>
:deep(.n-menu-item-content.n-menu-item-content--selected)::before {
  border-left: 4px solid var(--n-item-text-color-active);
}
</style>
