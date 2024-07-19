<script setup lang="ts">
import { RouterLink } from 'vue-router/auto'
import { useAppStore } from '~/stores'
import { renderIcon } from '~/utils'

const router = useRouter()
const appStroe = useAppStore()
const { isMenuCollapsed } = storeToRefs(appStroe)
const menuActiveKey = ref(router.currentRoute.value.path ?? '/')

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
      h(
        RouterLink,
        {
          to: {
            name: 'Home',
          },
        },
        { default: () => '上传图片' },
      ),
    key: '/',
    icon: renderIcon('i-ic-sharp-house !w20px !h20px'),
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
    icon: renderIcon('i-ic-baseline-photo-library !w18px !h18px'),
  },
  {
    key: 'divider-1',
    type: 'divider',
  },
  {
    label: () =>
      h('div', { class: 'text-neutral-500 text-xs flex justify-between items-center pr5' }, [
        h('span', { class: '' }, ['存储程序设置']),
      ]),
    key: 'user-storage',
    children: [
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                path: `/Setting/lskyPro`,
              },
            },
            { default: () => '兰空企业版' },
          ),
        key: `/Setting/lskyPro`,
        icon: renderIcon('i-ic-baseline-photo-library !w18px !h18px'),
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                path: `/Setting/lsky`,
              },
            },
            { default: () => '兰空社区版' },
          ),
        key: `/Setting/lsky`,
        icon: renderIcon('i-ic-baseline-photo-library !w18px !h18px'),
      },
    ],
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
