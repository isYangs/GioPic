<script setup lang="ts">
import { NButton } from 'naive-ui'
import StorageIcon from '~/components/Common/StorageIcon.vue'

const DEFAULT_STORAGE_ICON = 'ph:database-bold'

const router = useRouter()
const appStore = useAppStore()
const programStore = useProgramStore()
const pluginStore = usePluginStore()
const { isMenuCollapsed } = storeToRefs(appStore)
const menuActiveKey = ref(router.currentRoute.value.path ?? '/')
const expandedKeys = ref<string[]>(['user-storage'])

function getProgramIcon(programId: number): string {
  const currentProgram = programStore.getProgram(programId)
  const customIcon = currentProgram?.icon?.trim()
  if (customIcon) {
    return customIcon
  }

  const pluginIcon = currentProgram?.pluginId
    ? pluginStore.getPlugin(currentProgram.pluginId)?.icon?.trim()
    : ''
  if (pluginIcon) {
    return pluginIcon
  }

  return DEFAULT_STORAGE_ICON
}

function getProgramMenuIcon(programId: number) {
  const icon = getProgramIcon(programId)
  return () => h('div', { class: 'h4 w4 flex-center overflow-hidden rounded-sm' }, [
    h(StorageIcon, {
      icon,
      defaultIcon: DEFAULT_STORAGE_ICON,
      size: 16,
      alt: 'storage icon',
    }),
  ])
}

function openRemoveDialog(programId: number, programName: string, event: Event) {
  event.stopPropagation()
  event.preventDefault()

  window.$dialog.warning({
    title: '提示',
    content: `删除存储 "${programName}" 会导致配置丢失，是否继续？`,
    positiveText: '确定',
    negativeText: '取消',
    autoFocus: false,
    onPositiveClick: () => {
      const prevIndex = programStore.removeProgram(programId)
      window.$message.success('删除成功')

      const currentPath = router.currentRoute.value.path
      if (currentPath === `/Setting/${programId}`) {
        const nextId = programStore.programs[prevIndex]?.id
        router.push(`/Setting/${nextId ?? ''}`)
      }
    },
  })
}

const storageList = ref({
  label: () =>
    h('div', {
      class: 'flex justify-between items-center pr2 text-.93em',
      style: { color: 'var(--n-arrow-color-child-active)' },
    }, [
      h('span', ['存储配置']),
      h(NButton, {
        'class': 'w9 h5',
        'data-testid': 'create-program-button',
        'ariaLabel': '添加存储配置',
        'focusable': false,
        'onClick': (e) => {
          if (expandedKeys.value.includes('user-storage'))
            e.stopPropagation()
          openCreateProgram()
        },
        'renderIcon': renderIcon('i-ic-sharp-add !w16px !h16px'),
        'round': true,
        'secondary': true,
        'size': 'small',
        'type': 'tertiary',
      }),
    ]),
  key: 'user-storage',
  children: computed(() => programStore.getProgramList()
    .filter(program => program.value !== null)
    .map(({ value, label }) => ({
      label: () => h('div', { class: 'flex items-center w-full' }, [
        h('span', { class: 'flex-1 truncate' }, label),
        h('div', {
          class: 'i-ic-round-close delete-storage-btn',
          ariaLabel: '删除存储',
          onClick: e => openRemoveDialog(value as number, label, e),
        }),
      ]),
      key: `/Setting/${value}`,
      icon: getProgramMenuIcon(value as number),
    })),
  ),
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
    label: () => h('span', { 'data-testid': 'nav-home' }, '上传图片'),
    key: '/',
    icon: renderIcon('i-ph-upload-simple-bold w20px h20px'),
  },
  {
    label: () => h('span', { 'data-testid': 'nav-images' }, '图片列表'),
    key: '/Images',
    icon: renderIcon('i-ph-list-bullets-bold w20px h20px'),
  },
  {
    label: () => h('span', { 'data-testid': 'nav-plugins' }, '插件管理'),
    key: '/Setting/Plugins',
    icon: renderIcon('i-ph-puzzle-piece-bold w20px h20px'),
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

// Menu的key作为RouterLink的to属性，更简洁
function updateValue(value: string) {
  router.push(value)
}

function expandedKeysChange(keys: string[]) {
  expandedKeys.value = keys
}

onMounted(async () => {
  if (!pluginStore.loaded) {
    try {
      await pluginStore.loadPlugins()
    }
    catch (e) {
      console.error('加载插件失败:', e)
    }
  }
})
</script>

<template>
  <div class="h-full flex flex-col" data-testid="sidebar">
    <div class="min-h-0 flex-1">
      <n-scrollbar class="h-full">
        <n-menu
          v-model:value="menuActiveKey"
          :options="menuOptions"
          :collapsed="isMenuCollapsed"
          :collapsed-width="64"
          :default-expand-all="true"
          :root-indent="22"
          :indent="8"
          @update:expanded-keys="expandedKeysChange"
          @update:value="updateValue"
        />
      </n-scrollbar>
    </div>

    <transition name="upload-stats-fade">
      <upload-stats v-if="!isMenuCollapsed" class="flex-shrink-0" />
    </transition>
  </div>
</template>

<style scoped>
.upload-stats-fade-enter-active {
  transition: opacity 200ms ease-out;
  transition-delay: 150ms;
}

.upload-stats-fade-leave-active {
  transition: opacity 50ms ease-in;
}

.upload-stats-fade-enter-from,
.upload-stats-fade-leave-to {
  opacity: 0;
}

.upload-stats-fade-enter-to,
.upload-stats-fade-leave-from {
  opacity: 1;
}

:deep(.n-menu-item-group-title) {
  --uno: truncate;
}

:deep() .delete-storage-btn {
  opacity: 0;
  max-width: 0;
  transition: all 0.1s;
}

:deep(:is(.n-menu-item-content:hover, .n-menu-item-content--selected)) .delete-storage-btn {
  margin-left: 0.3em;
  opacity: 1;
  max-width: 1em;
}
</style>
