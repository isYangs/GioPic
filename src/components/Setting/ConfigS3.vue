<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import CodeInput from '~/components/Common/CodeInput.vue'
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
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          accessKeyId
        </div>
        <n-text class="text-xs op80">
          访问ID
        </n-text>
      </div>
      <CodeInput v-model:value="setting.accessKeyId" type="text" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          secretAccessKey
        </div>
        <n-text class="text-xs op80">
          访问密钥
        </n-text>
      </div>
      <CodeInput v-model:value="setting.secretAccessKey" type="text" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          bucketName
        </div>
        <n-text class="text-xs op80">
          存储桶名称
        </n-text>
      </div>
      <CodeInput v-model:value="setting.bucketName" type="text" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          pathPrefix
        </div>
        <n-text class="text-xs op80">
          上传路径前缀
        </n-text>
      </div>
      <CodeInput v-model:value="setting.pathPrefix" type="text" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          region
        </div>
        <n-text class="text-xs op80">
          区域
        </n-text>
      </div>
      <CodeInput v-model:value="setting.region" type="text" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          endpoint
        </div>
        <n-text class="text-xs op80">
          API端点
        </n-text>
      </div>
      <CodeInput v-model:value="setting.endpoint" type="text" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          customDomain
        </div>
        <n-text class="text-xs op80">
          自定义域名
        </n-text>
      </div>
      <CodeInput v-model:value="setting.customDomain" type="text" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          forcePathStyle
        </div>
        <n-text class="text-xs op80">
          存储桶名作为URL路径，仅支持 AWS S3
        </n-text>
      </div>
      <n-switch v-model:value="setting.forcePathStyle" :round="false" />
    </n-card>
    <n-card class="set-item mb3 wh-full rounded-2">
      <div class="flex flex-1 flex-col pr text-3.8 font-500 tracking-wider">
        <div class="flex items-center">
          ACL
        </div>
        <n-text class="text-xs op80">
          访问控制列表
        </n-text>
      </div>
      <CodeInput v-model:value="setting.acl" type="text" />
    </n-card>
  </n-form>
</template>

<style scoped>
.set-item :deep(.n-card__content) {
  --uno: flex flex-row items-center justify-between;
}

.set-item :deep(.n-select) {
  --uno: w50;
}

.set-item :deep(.n-input) {
  --uno: w75;
}
:deep(.n-form-item) > .n-form-item-feedback-wrapper {
  --uno: text-xs;
}
</style>
