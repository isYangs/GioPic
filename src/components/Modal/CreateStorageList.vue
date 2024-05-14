<script setup lang="ts">
import type { FormInst, FormRules } from 'naive-ui'
import { createFormRule, getStorageName, selectStorageOptions, validateLskyToken, validateUrl } from '~/utils'
import { useStorageListStore } from '~/stores'
import type { StorageListName } from '~/types'

const storageListStore = useStorageListStore()
const { storageList } = storeToRefs(storageListStore)
const selectStorageVal = ref<StorageListName>('lskyPro')
const createStorageModal = ref(false)
const formRef = ref<FormInst | null>(null)
const api = ref('')
const token = ref('')
const saveLoading = ref(false)

// 表单验证规则
const setRules: FormRules = {
  apiUrl: createFormRule(() => validateUrl(api.value)),
  token: createFormRule(() => validateLskyToken(token.value)),
}

// 关闭创建存储方式的弹窗
function closeCreateStorageModal() {
  createStorageModal.value = false
}

async function saveCreateStorageModal() {
  saveLoading.value = true
  try {
    if (!formRef.value)
      return
    const isValid = await formRef.value.validate(async (errors) => {
      if (errors) {
        window.$message.error('保存失败，请检查设置是否填写有误')
        return false
      }

      storageList.value.push({
        id: selectStorageVal.value,
        name: getStorageName(selectStorageVal.value),
        api: api.value,
        token: token.value,
        strategies: [],
        strategiesVal: null,
      })

      return true
    })

    if (!isValid)
      return

    if (!await storageListStore.getStrategies(selectStorageVal.value)) {
      window.$message.error('获取策略列表失败，请检查设置是否填写有误')
      return
    }

    closeCreateStorageModal()
  }
  finally {
    saveLoading.value = false
  }
}

defineExpose({
  createStorageModal,
})
</script>

<template>
  <n-modal
    v-model:show="createStorageModal"
    :auto-focus="false"
    :mask-closable="false"
    :bordered="false"
    :close-on-esc="false"
    :closable="false"
    preset="card"
    title="创建存储方式"
    transform-origin="center"
  >
    <div ma mb2 max-w-140 text-4>
      <div ma max-w-135>
        <n-form
          ref="formRef"
          :rules="setRules"
          label-placement="left"
          label-width="auto"
        >
          <n-form-item label="程序选择" :show-require-mark="true">
            <n-select v-model:value="selectStorageVal" :options="selectStorageOptions" :focusable="false" />
          </n-form-item>
          <n-form-item path="apiUrl" label="程序API地址">
            <n-input v-model:value="api" :focusable="false" placeholder="程序所对应的API地址" />
          </n-form-item>
          <n-form-item path="token" label="程序Token">
            <n-input v-model:value="token" :focusable="false" placeholder="程序所对应的Token" />
          </n-form-item>
        </n-form>
      </div>
    </div>
    <template #footer>
      <n-flex justify="space-between">
        <NButton strong secondary :focusable="false" @click="closeCreateStorageModal">
          取消
        </NButton>
        <NButton type="primary" :loading="saveLoading" :focusable="false" strong secondary @click="saveCreateStorageModal">
          创建
        </NButton>
      </n-flex>
    </template>
  </n-modal>
</template>

<style scoped></style>
