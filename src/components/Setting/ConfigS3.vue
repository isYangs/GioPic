<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import CodeInput from '~/components/Common/CodeInput.vue'
import { useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))
const programStore = useProgramStore()

// S3 配置项
const accessKeyID = ref('')
const secretAccessKey = ref('')
const bucketName = ref('')
const uploadPath = ref('')
const region = ref('')
const endpoint = ref('')

const setItem = useTemplateRef('setItemRef')

const rules: FormRules = {
  // apiUrl: createFormRule(() => validateUrl(api.value)),
  // token: createFormRule(() => validateLskyToken(token.value)),
}

const settingOptions = computed(() => [
  {
    name: 'accessKeyID',
    width: 300,
    tip: '实例:',
    component: () => {
      return h(CodeInput, {
        value: accessKeyID.value,
        type: 'text',
      })
    },
  },
  {
    name: 'secretAccessKey',
    width: 300,
    component: () => {
      return h(CodeInput, {
        value: secretAccessKey.value,
        type: 'text',
      })
    },
  },
  {
    name: 'bucketName',
    width: 300,
    component: () => {
      return h(CodeInput, {
        value: bucketName.value,
        type: 'text',
      })
    },
  },
  {
    name: 'uploadPath',
    width: 300,
    component: () => {
      return h(CodeInput, {
        value: uploadPath.value,
        type: 'text',
      })
    },
  },
  {
    name: 'region',
    width: 300,
    component: () => {
      return h(CodeInput, {
        value: region.value,
        type: 'text',
      })
    },
  },
  {
    name: 'endpoint',
    width: 300,
    component: () => {
      return h(CodeInput, {
        value: endpoint.value,
        type: 'text',
      })
    },
  },
])
</script>

<template>
  <div>
    <SettingSection ref="setItemRef" class="pt0" :items="settingOptions" :rules />
  </div>
</template>
