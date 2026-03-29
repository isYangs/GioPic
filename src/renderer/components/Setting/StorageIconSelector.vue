<script setup lang="ts">
import { useThemeVars } from 'naive-ui'

const props = withDefaults(defineProps<{
  modelValue?: string
  pluginIcon?: string
  defaultIcon?: string
}>(), {
  modelValue: '',
  pluginIcon: '',
  defaultIcon: 'ph:database-bold',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const themeVars = useThemeVars()

interface PresetIconItem {
  icon: string
  label: string
  group: string
  keywords: string[]
}

const PRESET_ICONIFY_ICONS = [
  { icon: 'ph:database-bold', label: '数据库', group: '基础', keywords: ['数据库', '存储', 'data', 'db'] },
  { icon: 'ph:cloud-bold', label: '云端', group: '基础', keywords: ['云', '云端', 'cloud'] },
  { icon: 'ph:hard-drives-bold', label: '硬盘', group: '基础', keywords: ['硬盘', '磁盘', '本地', 'drive'] },
  { icon: 'ph:desktop-tower-bold', label: '服务器', group: '基础', keywords: ['服务器', '主机', 'server', 'desktop'] },
  { icon: 'ph:folder-simple-bold', label: '文件夹', group: '基础', keywords: ['文件夹', '目录', 'folder'] },
  { icon: 'ph:folders-bold', label: '文件夹组', group: '基础', keywords: ['文件夹组', '目录组', 'folders'] },
  { icon: 'ph:archive-box-bold', label: '归档', group: '基础', keywords: ['归档', '压缩', 'archive', 'box'] },
  { icon: 'ph:file-bold', label: '文件', group: '基础', keywords: ['文件', 'file'] },
  { icon: 'ph:files-bold', label: '文件组', group: '基础', keywords: ['文件组', '多个文件', 'files'] },
  { icon: 'ph:upload-simple-bold', label: '上传', group: '操作', keywords: ['上传', 'upload'] },
  { icon: 'ph:tray-arrow-up-bold', label: '上传托盘', group: '操作', keywords: ['上传托盘', '托盘上传', 'tray upload'] },
  { icon: 'ph:box-arrow-up-bold', label: '导出', group: '操作', keywords: ['导出', '出库', 'box up'] },
  { icon: 'ph:paper-plane-tilt-bold', label: '投递', group: '操作', keywords: ['投递', '发送', 'plane', 'send'] },
  { icon: 'ph:lightning-bold', label: '闪电', group: '操作', keywords: ['闪电', '极速', 'lightning'] },
  { icon: 'ph:rocket-launch-bold', label: '火箭', group: '操作', keywords: ['火箭', '启动', 'rocket'] },
  { icon: 'ph:images-bold', label: '图库', group: '媒体', keywords: ['图集', '图库', 'images'] },
  { icon: 'ph:image-bold', label: '图片', group: '媒体', keywords: ['图片', 'image'] },
  { icon: 'ph:camera-bold', label: '相机', group: '媒体', keywords: ['相机', '拍照', 'camera'] },
  { icon: 'ph:link-simple-bold', label: '链接', group: '网络', keywords: ['链接', 'link', 'url'] },
  { icon: 'ph:globe-bold', label: '全球', group: '网络', keywords: ['全球', '网站', 'globe', 'web'] },
  { icon: 'ph:globe-hemisphere-west-bold', label: '互联网', group: '网络', keywords: ['互联网', '地球', 'globe west'] },
  { icon: 'ph:network-bold', label: '网络', group: '网络', keywords: ['网络', 'network'] },
  { icon: 'ph:circuitry-bold', label: '电路', group: '网络', keywords: ['电路', '节点', 'circuitry'] },
  { icon: 'ph:share-network-bold', label: '共享', group: '网络', keywords: ['共享', '分享', 'share', 'network'] },
  { icon: 'ph:stack-bold', label: '堆栈', group: '结构', keywords: ['堆栈', '层叠', 'stack'] },
  { icon: 'ph:stack-simple-bold', label: '多层', group: '结构', keywords: ['多层', '层级', 'stack simple'] },
  { icon: 'ph:package-bold', label: '包裹', group: '结构', keywords: ['包裹', 'package', 'box'] },
  { icon: 'ph:cube-bold', label: '立方体', group: '结构', keywords: ['立方体', 'cube'] },
  { icon: 'ph:tree-structure-bold', label: '树结构', group: '结构', keywords: ['树结构', '层级树', 'tree'] },
  { icon: 'ph:dropbox-logo-bold', label: 'Dropbox', group: '平台', keywords: ['dropbox', '网盘'] },
  { icon: 'ph:google-drive-logo-bold', label: 'Google Drive', group: '平台', keywords: ['google drive', '谷歌云盘', 'drive'] },
  { icon: 'ph:cloud-arrow-down-bold', label: '云下载', group: '平台', keywords: ['云下载', 'onedrive', 'download', 'cloud down'] },
  { icon: 'ph:amazon-logo-bold', label: 'Amazon', group: '平台', keywords: ['amazon', 'aws'] },
  { icon: 'ph:git-branch-bold', label: '分支', group: '平台', keywords: ['分支', 'git', 'branch'] },
  { icon: 'ph:terminal-window-bold', label: '终端', group: '平台', keywords: ['终端', '命令行', 'terminal'] },
  { icon: 'ph:key-bold', label: '密钥', group: '安全', keywords: ['密钥', 'key'] },
  { icon: 'ph:lock-bold', label: '锁定', group: '安全', keywords: ['锁定', 'lock'] },
  { icon: 'ph:lock-key-bold', label: '安全锁', group: '安全', keywords: ['安全', '锁', 'lock', 'key'] },
  { icon: 'ph:shield-bold', label: '护盾', group: '安全', keywords: ['护盾', 'shield'] },
  { icon: 'ph:shield-check-bold', label: '校验', group: '安全', keywords: ['校验', '防护', 'shield', 'check'] },
  { icon: 'ph:certificate-bold', label: '证书', group: '安全', keywords: ['证书', 'certificate'] },
  { icon: 'ph:wrench-bold', label: '工具', group: '安全', keywords: ['工具', '设置', 'wrench'] },
] as const satisfies readonly PresetIconItem[]

const PH_ICON_PATTERN = /^ph:[a-z0-9][a-z0-9-]*$/i

const showIconPanel = ref(false)
const iconSearchKeyword = ref('')
const iconInputValue = ref('')

const matchedPresetIcons = computed(() => {
  const keyword = iconSearchKeyword.value.trim().toLowerCase()
  if (!keyword) {
    return PRESET_ICONIFY_ICONS
  }
  return PRESET_ICONIFY_ICONS.filter(({ icon, label, keywords }) => {
    return icon.toLowerCase().includes(keyword)
      || label.toLowerCase().includes(keyword)
      || keywords.some(item => item.toLowerCase().includes(keyword))
  })
})

const groupedPresetIcons = computed(() => {
  const groups = new Map<string, PresetIconItem[]>()
  for (const item of matchedPresetIcons.value) {
    const current = groups.get(item.group) || []
    current.push(item)
    groups.set(item.group, current)
  }
  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }))
})

const modelIcon = computed(() => props.modelValue.trim())
const normalizedModelIcon = computed(() => (isPhIcon(modelIcon.value) ? modelIcon.value : ''))
const pluginIcon = computed(() => props.pluginIcon.trim())
const selectedPreset = computed(() => PRESET_ICONIFY_ICONS.find(item => item.icon === normalizedModelIcon.value))
const pluginPreset = computed(() => PRESET_ICONIFY_ICONS.find(item => item.icon === pluginIcon.value))

const activeIconSource = computed(() => {
  if (normalizedModelIcon.value) {
    return {
      source: 'custom' as const,
      icon: normalizedModelIcon.value,
    }
  }

  if (pluginIcon.value) {
    return {
      source: 'plugin' as const,
      icon: pluginIcon.value,
    }
  }

  return {
    source: 'default' as const,
    icon: props.defaultIcon,
  }
})

const activeIconMeta = computed(() => {
  if (activeIconSource.value.source === 'custom') {
    return {
      title: selectedPreset.value?.label || '自定义图标',
      desc: selectedPreset.value ? selectedPreset.value.icon : normalizedModelIcon.value,
      tag: '当前配置',
    }
  }

  if (activeIconSource.value.source === 'plugin') {
    return {
      title: pluginPreset.value?.label || '插件图标',
      desc: '自动继承插件图标',
      tag: '插件默认',
    }
  }

  return {
    title: '默认图标',
    desc: '使用内置默认图标',
    tag: '系统默认',
  }
})

function isPhIcon(icon: string): boolean {
  return PH_ICON_PATTERN.test(icon)
}

function updateIcon(icon: string) {
  emit('update:modelValue', icon)
}

function selectPresetIcon(icon: string) {
  iconInputValue.value = icon
  updateIcon(icon)
  showIconPanel.value = false
}

function clearIcon() {
  updateIcon('')
  iconInputValue.value = ''
  showIconPanel.value = false
}

function applyIconInput() {
  const icon = iconInputValue.value.trim()
  if (!icon) {
    clearIcon()
    return
  }

  if (!isPhIcon(icon)) {
    window.$message.warning('仅支持 Phosphor 图标（ph:），例如 ph:cloud-bold')
    return
  }

  updateIcon(icon)
  showIconPanel.value = false
}

watch(() => props.modelValue, (icon) => {
  const currentIcon = icon || ''
  iconInputValue.value = isPhIcon(currentIcon) ? currentIcon : ''
}, { immediate: true })
</script>

<template>
  <n-popover v-model:show="showIconPanel" trigger="click" placement="bottom-end">
    <template #trigger>
      <button
        type="button"
        class="storage-icon-selector-trigger w-75 flex items-center gap-3 border border-[var(--n-border-color)] bg-[var(--n-color)] px-3 py-2 text-left transition-colors"
        :style="{ borderRadius: 'var(--n-border-radius)' }"
      >
        <div class="h-9 w-9 flex shrink-0 items-center justify-center bg-gray-100/80 dark:bg-white/8" :style="{ borderRadius: 'calc(var(--n-border-radius) - 2px)' }">
          <storage-icon :icon="activeIconSource.icon" :default-icon="defaultIcon" :size="18" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-500">{{ activeIconMeta.title }}</span>
            <span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] op-70 dark:bg-white/8">{{ activeIconMeta.tag }}</span>
          </div>
          <div class="truncate text-[11px] op-50">
            {{ activeIconMeta.desc }}
          </div>
        </div>

        <i class="i-ph-caret-down text-sm op-45" />
      </button>
    </template>

    <div class="w-72 flex flex-col gap-2">
      <n-input
        v-model:value="iconSearchKeyword"
        size="small"
        clearable
        placeholder="搜索图标"
      >
        <template #prefix>
          <i class="i-ph-magnifying-glass op-50" />
        </template>
      </n-input>

      <div class="bg-gray-100/50 p-2 dark:bg-white/5" :style="{ borderRadius: 'var(--n-border-radius)' }">
        <n-scrollbar style="max-height: 208px">
          <div class="flex flex-col gap-2 pr-2">
            <template v-if="groupedPresetIcons.length">
              <div v-for="section in groupedPresetIcons" :key="section.group" class="flex flex-col gap-1">
                <div class="text-[10px] font-500 op-45">
                  {{ section.group }}
                </div>

                <div class="grid grid-cols-2 gap-1.5">
                  <button
                    v-for="item in section.items"
                    :key="item.icon"
                    type="button"
                    class="storage-icon-selector-item flex items-center gap-2 border border-transparent px-2 py-1.5 text-left text-[var(--n-text-color)] transition-colors"
                    :class="{ 'storage-icon-selector-item--active': normalizedModelIcon === item.icon }"
                    :style="{
                      borderRadius: 'calc(var(--n-border-radius) - 2px)',
                      ...(normalizedModelIcon === item.icon
                        ? {
                          borderColor: themeVars.primaryColor,
                          boxShadow: `inset 0 0 0 1px ${themeVars.primaryColor}`,
                        }
                        : {}),
                    }"
                    :title="item.label"
                    @click="selectPresetIcon(item.icon)"
                  >
                    <div
                      class="h-7 w-7 flex shrink-0 items-center justify-center bg-gray-100/80 dark:bg-white/8"
                      :style="{
                        borderRadius: 'calc(var(--n-border-radius) - 4px)',
                        ...(normalizedModelIcon === item.icon
                          ? {
                            color: themeVars.primaryColor,
                          }
                          : {}),
                      }"
                    >
                      <storage-icon :icon="item.icon" :default-icon="defaultIcon" :size="16" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <div
                        class="truncate text-xs font-500"
                        :style="normalizedModelIcon === item.icon ? { color: themeVars.textColor1 } : undefined"
                      >
                        {{ item.label }}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </template>

            <div v-else class="py-6 text-center text-xs op-50">
              没有匹配图标
            </div>
          </div>
        </n-scrollbar>
      </div>

      <n-input
        v-model:value="iconInputValue"
        size="small"
        clearable
        placeholder="自定义图标，如 ph:cloud-bold"
        @keyup.enter="applyIconInput"
      />

      <div class="flex items-center justify-end gap-2 pt-1">
        <n-button size="small" @click="clearIcon">
          自动
        </n-button>
        <n-button type="primary" size="small" @click="applyIconInput">
          应用
        </n-button>
      </div>
    </div>
  </n-popover>
</template>

<style scoped>
.storage-icon-selector-trigger,
.storage-icon-selector-item {
  outline: none;
  appearance: none;
}

.storage-icon-selector-trigger:hover {
  border-color: color-mix(in srgb, var(--n-color-target) 40%, var(--n-border-color));
}

.storage-icon-selector-trigger:focus-visible {
  border-color: var(--n-color-target);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--n-color-target) 20%, transparent);
}

.storage-icon-selector-item:focus-visible {
  border-color: var(--n-primary-color);
  box-shadow: 0 0 0 2px var(--n-primary-color-suppl);
}
</style>
