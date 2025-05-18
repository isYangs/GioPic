<script setup lang="ts">
import type { ProgramDetail } from '@/types'
import { useProgramStore } from '~/stores'

const route = useRoute('/Setting/[id]')
const id = ref(Number.parseInt(route.params.id))
const programStore = useProgramStore()

const setting = computed({
  get: () => programStore.getProgram(id.value).detail as ProgramDetail['s3'],
  set: val => programStore.setProgramDetail(id.value, val),
})

const aclTypes = [
  'private',
  'public-read',
  'public-read-write',
  'authenticated-read',
  'bucket-owner-read',
  'bucket-owner-full-control',
]

const aclOptions = aclTypes.map(value => ({ label: value, value }))
</script>

<template>
  <n-form>
    <setting-item title="accessKeyId" desc="服务商访问密钥 ID">
      <code-input
        v-model:value="setting.accessKeyId"
        type="text"
        placeholder="AKIAIOSFODNN7EXAMPLE"
      />
    </setting-item>

    <setting-item title="secretAccessKey" desc="服务商访问密钥">
      <code-input
        v-model:value="setting.secretAccessKey"
        type="text"
        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
      />
    </setting-item>

    <setting-item title="bucketName" desc="存储桶名称">
      <code-input
        v-model:value="setting.bucketName"
        type="text"
        placeholder="my-bucket-name"
      />
    </setting-item>

    <setting-item title="pathPrefix" desc="文件上传路径">
      <code-input
        v-model:value="setting.pathPrefix"
        type="text"
        placeholder="images/ 或 uploads/images/"
      />
    </setting-item>

    <setting-item title="region" desc="服务商所提供的 S3 区域">
      <code-input
        v-model:value="setting.region"
        type="text"
        placeholder="us-east-1"
      />
    </setting-item>

    <setting-item title="endpoint" desc="服务商所提供的 S3 服务地址">
      <code-input
        v-model:value="setting.endpoint"
        type="text"
        placeholder="s3.amazonaws.com"
      />
    </setting-item>

    <setting-item title="customDomain" desc="自定义域名">
      <code-input
        v-model:value="setting.customDomain"
        type="text"
        placeholder="cdn.example.com"
      />
    </setting-item>

    <setting-item title="forcePathStyle" desc="仅支持 AWS S3">
      <n-switch v-model:value="setting.forcePathStyle" :round="false" />
    </setting-item>

    <setting-item title="ACL" desc="访问控制列表，若此处设置后上传页面的权限选择将会被禁用">
      <n-select
        v-model:value="setting.acl"
        :options="aclOptions"
        placeholder="请选择访问控制级别"
        clearable
      />
    </setting-item>
  </n-form>
</template>
