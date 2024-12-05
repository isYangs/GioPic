<script setup lang="ts">
import { NButton } from 'naive-ui'
import { RouterLink } from 'vue-router/auto'
import CreateProgram from '../Setting/CreateProgram.vue'

const router = useRouter()
const appStore = useAppStore()
const programStore = useProgramStore()
const { isMenuCollapsed } = storeToRefs(appStore)
const menuActiveKey = ref(router.currentRoute.value.path ?? '/')
const expandedKeys = ref<string[]>(['user-storage'])
const showCreateProgram = ref(false)

function expandedKeysChange(keys: string[]) {
  expandedKeys.value = keys
}

const storageList = ref({
  label: () =>
    h('div', {
      class: 'flex justify-between items-center pr2 text-.93em',
      style: { color: 'var(--n-arrow-color-child-active)' },
    }, [
      h('span', ['存储配置']),
      h(NButton, {
        class: 'w9 h5',
        size: 'small',
        type: 'tertiary',
        round: true,
        strong: true,
        secondary: true,
        ariaLabel: '添加存储配置',
        renderIcon: renderIcon('i-ic-sharp-add !w16px !h16px'),
        onClick: (e) => {
          if (expandedKeys.value.includes('user-storage'))
            e.stopPropagation()
          showCreateProgram.value = true
        },
      }),
    ]),
  key: 'user-storage',
  children: computed(() => programStore.getProgramList().map(program => ({
    label: () => h(RouterLink, {
      to: {
        // BUG: 点击同页面还会跳转
        name: '/Setting/',
      },
    }, { default: () => program.name || programStore.getProgramTypeName(program.type) }),
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
  <n-scrollbar>
    <n-menu
      v-model:value="menuActiveKey"
      :options="menuOptions"
      :collapsed="isMenuCollapsed"
      :collapsed-width="64"
      :default-expand-all="true"
      :root-indent="22"
      :indent="0"
      @update:expanded-keys="expandedKeysChange"
      @update:value="updateValue"
    />
    <CreateProgram v-model="showCreateProgram" />
  </n-scrollbar>
</template>

<style scoped>
</style>
