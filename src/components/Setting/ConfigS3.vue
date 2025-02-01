<script setup lang="ts">
import { type FormRules, NSwitch } from 'naive-ui'
import CodeInput from '~/components/Common/CodeInput.vue'
import { useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))
const programStore = useProgramStore()

const setting = computed(() => programStore.getProgram(id.value).detail as ProgramDetail['s3'])

// S3 配置项
const accessKeyID = ref(setting.value.accessKeyID)
const secretAccessKey = ref(setting.value.secretAccessKey)
const bucketName = ref(setting.value.bucketName)
const uploadPath = ref(setting.value.uploadPath)
const region = ref(setting.value.region)
const endpoint = ref(setting.value.endpoint)
const urlPrefix = ref(setting.value.urlPrefix)
const pathStyleAccess = ref(setting.value.pathStyleAccess)
const rejectUnauthorized = ref(setting.value.rejectUnauthorized)
const acl = ref(setting.value.acl)
const disableBucketPrefixToURL = ref(setting.value.disableBucketPrefixToURL)

const setItem = useTemplateRef('setItemRef') // for validation

const rules: FormRules = {
  // apiUrl: createFormRule(() => validateUrl(api.value)),
  // token: createFormRule(() => validateLskyToken(token.value)),
}

const settingOptions = computed(() => [
  {
    name: 'accessKeyID',
    width: 300,
    tip: '访问ID',
    component: () => {
      return h(CodeInput, {
        value: accessKeyID.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          accessKeyID.value = val
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
    name: 'uploadPath',
    width: 300,
    tip: '上传路径',
    component: () => {
      return h(CodeInput, {
        value: uploadPath.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          uploadPath.value = val
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
    name: 'urlPrefix',
    width: 300,
    tip: 'URL前缀',
    component: () => {
      return h(CodeInput, {
        value: urlPrefix.value,
        type: 'text',
        onUpdateValue: (val: string) => {
          urlPrefix.value = val
          saveSetting()
        },
      })
    },
  },
  {
    name: 'pathStyleAccess',
    tip: '以路径风格访问',
    component: () => {
      return h(NSwitch, {
        round: false,
        checked: pathStyleAccess.value,
        onUpdateValue: (val: boolean) => {
          pathStyleAccess.value = val
        },
      })
    },
  },
  {
    name: 'rejectUnauthorized',
    tip: '拒绝未授权的请求',
    component: () => {
      return h(NSwitch, {
        round: false,
        checked: rejectUnauthorized.value,
        onUpdateValue: (val: boolean) => {
          rejectUnauthorized.value = val
        },
      })
    },
  },
  {
    name: 'ACL',
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
  {
    name: 'disableBucketPrefixToURL',
    tip: '禁用存储桶前缀',
    component: () => {
      return h(NSwitch, {
        round: false,
        checked: disableBucketPrefixToURL.value,
        onUpdateValue: (val: boolean) => {
          disableBucketPrefixToURL.value = val
        },
      })
    },
  },
])

async function saveSetting() {
  await programStore.setProgramDetail(id.value, {
    accessKeyID: accessKeyID.value,
    secretAccessKey: secretAccessKey.value,
    bucketName: bucketName.value,
    uploadPath: uploadPath.value,
    region: region.value,
    endpoint: endpoint.value,
    urlPrefix: urlPrefix.value,
    pathStyleAccess: pathStyleAccess.value,
    rejectUnauthorized: rejectUnauthorized.value,
    acl: acl.value,
    disableBucketPrefixToURL: disableBucketPrefixToURL.value,
  })
}
</script>

<template>
  <div>
    <SettingSection ref="setItemRef" class="pt0" :items="settingOptions" :rules />
  </div>
</template>
