<script setup lang="ts">
import { useAppStore } from '~/stores'

const router = useRouter()
const appStore = useAppStore()

const { isMenuCollapsed } = storeToRefs(appStore)
</script>

<template>
  <div class="h9 cursor-pointer" :class="isMenuCollapsed ? 'w16 px2' : 'w60 px1'">
    <div class="no-draggable mx4 hfull w-fit flex items-center gap-1.5" @click="router.push('/')">
      <div class="w5">
        <IconSVG />
      </div>
      <template v-if="!isMenuCollapsed">
        <h1 class="font-type translate-y-[.04em] text-lg">
          GioPic
        </h1>
        <div class="border border-current rounded-.5 px.2 text-2.5 lh-[1] op50">
          Beta
        </div>
      </template>
    </div>
  </div>
</template>
