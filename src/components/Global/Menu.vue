<script setup lang="ts">
import type { MenuOption } from 'naive-ui'
import { RouterLink } from 'vue-router/auto'

defineProps<{
  collapsed: boolean
}>()

const router = useRouter()
console.log(router.options.routes)

function renderIcon(icon: string) {
  return () => h('div', { class: icon })
}

const menuOptions = computed((): MenuOption[] => [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            name: '/',
          },
        },
        { default: () => '首页' },
      ),
    key: '/',
    icon: renderIcon('i-ic-sharp-home'),
  },
])

function handleUpdateValue(value: string) {
  router.push(value)
}
</script>

<template>
  <n-menu
    :options="menuOptions"
    :collapsed="collapsed"
    :collapsed-width="64"
    :collapsed-icon-size="22"
    @update:value="handleUpdateValue"
  />
</template>

<style scoped></style>
