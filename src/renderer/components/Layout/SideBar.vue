<script setup lang="ts">
import { NButton } from 'naive-ui'
import { RouterLink } from 'vue-router/auto'
import { useAppStore, useProgramStore } from '~/stores'
import { renderIcon } from '~/utils/main'
import { openCreateProgram } from '~/utils/modal'

const router = useRouter()
const appStore = useAppStore()
const programStore = useProgramStore()
const { isMenuCollapsed } = storeToRefs(appStore)
const menuActiveKey = ref(router.currentRoute.value.path ?? '/')
const expandedKeys = ref<string[]>(['user-storage'])

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
        class: 'w9 h5',
        size: 'small',
        type: 'tertiary',
        round: true,
        strong: true,
        secondary: true,
        focusable: false,
        ariaLabel: '添加存储配置',
        renderIcon: renderIcon('i-ic-sharp-add !w16px !h16px'),
        onClick: (e) => {
          if (expandedKeys.value.includes('user-storage'))
            e.stopPropagation()
          openCreateProgram()
        },
      }),
    ]),
  key: 'user-storage',
  children: computed(() => programStore.getProgramList().filter(program => program.value !== null).map(program => ({
    label: () => h('div', {
      class: 'flex justify-between items-center w-full group',
    }, [
      h(RouterLink, {
        to: `/Setting/${program.value}`,
        class: 'flex-1 text-left truncate',
      }, { default: () => program.label }),
      h('div', {
        class: `${menuActiveKey.value === `/Setting/${program.value}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity ml2 flex-shrink-0 flex-center cursor-pointer rounded-1`,
        ariaLabel: '删除存储',
        onClick: e => openRemoveDialog(program.value as number, program.label, e),
      }, [
        h('div', { class: 'i-ic-round-close text-sm' }),
      ]),
    ]),
    key: `/Setting/${program.value}`,
    icon: renderIcon('i-ph-database-bold w16px h16px'),
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
    label: () =>
      h(RouterLink, {
        to: {
          name: '/Setting/Plugins',
        },
      }, { default: () => '插件管理' }),
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

function updateValue(value: string) {
  router.push(value)
}

function expandedKeysChange(keys: string[]) {
  expandedKeys.value = keys
}
</script>

<template>
  <div class="h-full flex flex-col">
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
</style>
