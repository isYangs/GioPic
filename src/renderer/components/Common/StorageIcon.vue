<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'

type IconRenderType = 'image' | 'iconify' | 'unocss'

const props = withDefaults(defineProps<{
  icon?: string
  defaultIcon?: string
  size?: number
  alt?: string
}>(), {
  icon: '',
  defaultIcon: 'ph:database-bold',
  size: 20,
  alt: 'icon',
})

const PH_ICON_PATTERN = /^ph:[a-z0-9][a-z0-9-]*$/i
const IMAGE_ICON_PATTERN = /^(?:https?:|file:|data:)/i

function getIconType(icon: string): IconRenderType | null {
  if (IMAGE_ICON_PATTERN.test(icon))
    return 'image'
  if (PH_ICON_PATTERN.test(icon))
    return 'iconify'
  if (icon.startsWith('i-'))
    return 'unocss'
  return null
}

const renderInfo = computed(() => {
  const primaryIcon = props.icon.trim()
  const fallbackIcon = props.defaultIcon.trim() || 'ph:database-bold'

  const primaryType = primaryIcon ? getIconType(primaryIcon) : null
  if (primaryType) {
    return { icon: primaryIcon, type: primaryType as IconRenderType }
  }

  const fallbackType = getIconType(fallbackIcon)
  if (fallbackType) {
    return { icon: fallbackIcon, type: fallbackType as IconRenderType }
  }

  return { icon: 'ph:database-bold', type: 'iconify' as IconRenderType }
})
</script>

<template>
  <div class="h-full w-full flex-center overflow-hidden">
    <img
      v-if="renderInfo.type === 'image'"
      :src="renderInfo.icon"
      :alt="alt"
      class="h-full w-full object-contain"
    >
    <iconify-icon
      v-else-if="renderInfo.type === 'iconify'"
      :icon="renderInfo.icon"
      :width="size"
      :height="size"
    />
    <div
      v-else
      :class="renderInfo.icon"
      :style="{ width: `${size}px`, height: `${size}px` }"
    />
  </div>
</template>
