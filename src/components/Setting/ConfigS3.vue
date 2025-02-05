<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import type { ProgramDetail } from '~/stores'
import { useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))
const programStore = useProgramStore()

const setting = computed({
  get: () => programStore.getProgram(id.value).detail as ProgramDetail['s3'],
  set: val => programStore.setProgramDetail(id.value, val),
})

const setForm = useTemplateRef('setFormRef')

const rules: FormRules = {
//   accessKeyId: ,
//   secretAccessKey: ,
//   bucketName: ,
//   pathPrefix: ,
//   region: ,
//   endpoint: ,
//   customDomain: ,
//   acl: ,
}
</script>

<template>
  <n-form ref="setFormRef" :rules="rules">
    <setting-item title="accessKeyId" desc="访问ID">
      <code-input v-model:value="setting.accessKeyId" type="text" />
    </setting-item>

    <setting-item title="secretAccessKey" desc="访问密钥">
      <code-input v-model:value="setting.secretAccessKey" type="text" />
    </setting-item>

    <setting-item title="bucketName" desc="存储桶名称">
      <code-input v-model:value="setting.bucketName" type="text" />
    </setting-item>

    <setting-item title="pathPrefix" desc="上传路径前缀">
      <code-input v-model:value="setting.pathPrefix" type="text" />
    </setting-item>

    <setting-item title="region" desc="区域">
      <code-input v-model:value="setting.region" type="text" />
    </setting-item>

    <setting-item title="endpoint" desc="API端点">
      <code-input v-model:value="setting.endpoint" type="text" />
    </setting-item>

    <setting-item title="customDomain" desc="自定义域名">
      <code-input v-model:value="setting.customDomain" type="text" />
    </setting-item>

    <setting-item title="forcePathStyle" desc="存储桶名作为URL路径，仅支持 AWS S3">
      <n-switch v-model:value="setting.forcePathStyle" :round="false" />
    </setting-item>

    <setting-item title="ACL" desc="访问控制列表">
      <code-input v-model:value="setting.acl" type="text" />
    </setting-item>
  </n-form>
</template>
