<script setup lang="ts">
import { type FormRules, NSwitch } from 'naive-ui'
import CodeInput from '~/components/Common/CodeInput.vue'
import type { ProgramDetail } from '~/stores'
import { useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))
const programStore = useProgramStore()

const setting = computed(() => programStore.getProgram(id.value).detail as ProgramDetail['s3'])

// S3 配置项
const accessKeyId = ref(setting.value.accessKeyId)
const secretAccessKey = ref(setting.value.secretAccessKey)
const bucketName = ref(setting.value.bucketName)
const pathPrefix = ref(setting.value.pathPrefix)
const region = ref(setting.value.region)
const endpoint = ref(setting.value.endpoint)
const customDomain = ref(setting.value.customDomain)
const forcePathStyle = ref(setting.value.forcePathStyle)
const acl = ref(setting.value.acl)

const setItem = useTemplateRef('setItemRef') // for validation

const rules: FormRules = {
  // apiUrl: createFormRule(() => validateUrl(api.value)),
  // token: createFormRule(() => validateLskyToken(token.value)),
}

const settingOptions = computed(() => [
  {
    name: 'accessKeyId',
    width: 300,
    tip: '访问ID',
    component: () => {
      return h(CodeInput, {
        value: accessKeyId.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          accessKeyId.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'secretAccessKey',
    width: 300,
    tip: '访问密钥',
    component: () => {
      return h(CodeInput, {
        value: secretAccessKey.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          secretAccessKey.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'bucketName',
    width: 300,
    tip: '存储桶名称',
    component: () => {
      return h(CodeInput, {
        value: bucketName.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          bucketName.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'pathPrefix',
    width: 300,
    tip: '上传路径前缀',
    component: () => {
      return h(CodeInput, {
        value: pathPrefix.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          pathPrefix.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'region',
    width: 300,
    tip: '区域',
    component: () => {
      return h(CodeInput, {
        value: region.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          region.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'endpoint',
    width: 300,
    tip: 'API端点',
    component: () => {
      return h(CodeInput, {
        value: endpoint.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          endpoint.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'customDomain',
    width: 300,
    tip: '自定义域名',
    component: () => {
      return h(CodeInput, {
        value: customDomain.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          customDomain.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'forcePathStyle',
    tip: '存储桶名作为URL路径，仅支持 AWS S3',
    component: () => {
      return h(NSwitch, {
        value: forcePathStyle.value,
        round: false,
        onUpdateValue: (val: boolean) => {
          forcePathStyle.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'ACL',
    width: 300,
    tip: '访问控制列表',
    component: () => {
      return h(CodeInput, {
        value: acl.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          acl.value = val
          saveSetting()
        },
      })
    },
  },
])

async function saveSetting() {
  await programStore.setProgramDetail(id.value, {
    accessKeyId: accessKeyId.value,
    secretAccessKey: secretAccessKey.value,
    bucketName: bucketName.value,
    pathPrefix: pathPrefix.value,
    region: region.value,
    endpoint: endpoint.value,
    customDomain: customDomain.value,
    forcePathStyle: forcePathStyle.value,
    acl: acl.value,
  })
}
</script>

<template>
  <div>
    <SettingSection ref="setItemRef" class="pt0" :items="settingOptions" :rules />
  </div>
</template>
