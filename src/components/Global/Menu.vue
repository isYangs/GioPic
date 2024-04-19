<script setup lang="ts">
import { NButton } from 'naive-ui'
import { RouterLink } from 'vue-router/auto'
import { useAppStore } from '~/stores'

const appStroe = useAppStore()
const { isMenuCollapsed } = storeToRefs(appStroe)
const router = useRouter()
const menuActiveKey = ref(router.currentRoute.value.path ?? '/')
const createStorageRef = ref<any>(null)

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
        onClick: () => createStorageRef.value?.openCreateStorageModal(),
      }),
    ]),
  key: 'user-storage',
  children: [],
})

const menuOptions = reactive([
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

function renderIcon(icon: string) {
  return () => h('div', { class: `${icon} ` })
}

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
    :indent="22"
    @update:value="updateValue"
  />
  <CreateStorageList :menu-options="menuOptions" ref="createStorageRef" />
</template>

<style scoped>
:deep(.n-menu-item-content.n-menu-item-content--selected)::before {
  border-left: 4px solid var(--n-item-text-color-active);
}
</style>
