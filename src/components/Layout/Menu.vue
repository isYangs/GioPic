<script setup lang="ts">
import { NButton } from 'naive-ui'
import { RouterLink } from 'vue-router/auto'

const router = useRouter()
const appStore = useAppStore()
const programStore = useProgramStore()
const { isMenuCollapsed } = storeToRefs(appStore)
const menuActiveKey = ref(router.currentRoute.value.path ?? '/')
const expandedKeys = ref<string[]>(['user-storage'])

function expandedKeysChange(keys: string[]) {
  expandedKeys.value = keys
}

const storageList = ref({
  label: () =>
    h('div', { class: 'text-neutral-500 text-xs flex justify-between items-center pr5' }, [
      h('span', ['存储配置']),
      h(NButton, {
        class: 'w9 h5',
        size: 'small',
        type: 'tertiary',
        round: true,
        strong: true,
        secondary: true,
        renderIcon: renderIcon('i-ic-sharp-add !w16px !h16px'),
        onClick: (e) => {
          e.stopPropagation()
          if (!expandedKeys.value.includes('user-storage')) {
            expandedKeys.value.push('user-storage')
          }
          const id = programStore.createProgram()
          router.push(`/Setting/${id}`)
        },
      }),
    ]),
  key: 'user-storage',
  children: computed(() => programStore.getProgramList().map(program => ({
    label: () => h(RouterLink, {
      to: {
        name: '/Setting/',
      },
    }, { default: () => program.name }),
    key: `/Setting/${program.id}`,
  }))),
})

const menuOptions = computed(() => [
  {
    type: 'group',
    label: '我的图片',
    key: 'main',
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
    ...storageList.value,
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
    :default-expand-all="true"
    :indent="22"
    @update:expanded-keys="expandedKeysChange"
    @update:value="updateValue"
  />
</template>

<style scoped>
:deep(.n-menu-item-content.n-menu-item-content--selected)::before {
  border-left: 4px solid var(--n-item-text-color-active);
}
</style>
