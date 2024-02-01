<script setup lang="ts">
import { MenuOption } from 'naive-ui'
import { RouterLink } from 'vue-router/auto'

defineProps<{
  collapsed: boolean
}>()

const router = useRouter()
console.log(router.options.routes)

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
  },
])

const handleUpdateValue = (value: string) => {
  console.log(value)
  router.push(value)
}
</script>

<template>
  <n-menu
    :options="menuOptions"
    @update:value="handleUpdateValue"
    :collapsed="collapsed"
    :collapsed-width="64"
    :collapsed-icon-size="22"
  />
</template>

<style scoped></style>
