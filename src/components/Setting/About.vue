<script setup lang="ts">
const appVersion = ref('0.0.0')

const infoItems = ref([
  {
    label: '版本',
    value: appVersion,
    link: 'https://github.com/isYangs/GioPic/releases',
  },
  {
    label: '作者',
    value: 'isYangs',
    link: 'https://github.com/isYangs',
  },
  {
    label: '开源仓库',
    value: 'GioPic',
    link: 'https://github.com/isYangs/GioPic',
  },
  {
    label: '协议',
    value: 'AGPL-3.0',
    link: 'https://github.com/isYangs/GioPic/blob/main/LICENSE',
  },
])

async function getAppVersion() {
  const version = await window.ipcRenderer.invoke('app-version')
  return version
}

onMounted(async () => {
  appVersion.value = await getAppVersion()
})
</script>

<template>
  <div class="mt10% flex-center flex-col gap-10">
    <img src="/icon.png" class="h40 w40">
    <div class="font-type text-center text-2xl fw700">
      GioPic
    </div>
    <div class="m10 flex-center gap-10">
      <div v-for="item in infoItems" :key="item.label" class="flex-center flex-col gap-2">
        <div class="text-sm text-gray-500">
          {{ item.label }}
        </div>
        <a v-if="item.link" :href="item.link" target="_blank" class="text-sm text-blue-500 hover:underline">{{ item.value }}</a>
      </div>
    </div>
  </div>
</template>
