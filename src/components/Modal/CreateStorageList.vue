<script setup lang="ts">
import type {  StepsProps } from 'naive-ui'
import { useStepStore, useStorageAppStore } from '~/stores'

const stepStore = useStepStore()
const storageAppStore = useStorageAppStore()
const { selectStorageValue } = storeToRefs(stepStore)
const { lskyProStrategies, lskyProStrategiesVal } = storeToRefs(storageAppStore)
const createStorageModal = ref(false)
const currentStep = ref(1)
const currentStatus = ref<StepsProps['status']>('process')
const storageComponentRef = ref<any>(null)
const nextLoading = ref(false)

const selectStorageOptions = [
  {
    label: '兰空图床',
    value: 'Lsky',
  },
  {
    label: '兰空企业版',
    value: 'LskyPro',
  },
]

async function processStep(actionType: string) {
  const stepProcessors: { [key: number]: () => Promise<any> } = {
    1: async () => {},
    2: async () => {
      nextLoading.value = true
      await storageComponentRef.value?.saveSet()
      await storageComponentRef.value?.getStrategies()
      nextLoading.value = false
    },
    3: async () => {},
  }

  if (actionType === 'next' && currentStep.value < 3) {
    const processor = stepProcessors[currentStep.value]
    const result = await processor()
    if (result === false)
      return

    currentStep.value += 1
  }
  else if (actionType === 'prev' && currentStep.value > 1) {
    currentStep.value -= 1
  }
  else if (actionType === 'save') {
    closeCreateStorageModal()

    // 创建一个新Menu菜单的逻辑

  }
  else if (actionType === 'cancel') {
    closeCreateStorageModal()
  }
}

// 关闭创建存储方式的弹窗
function closeCreateStorageModal() {
  createStorageModal.value = false
  currentStep.value = 1
}

// 打开创建存储方式的弹窗
function openCreateStorageModal() {
  createStorageModal.value = true
}

defineExpose({
  openCreateStorageModal,
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
      <n-space justify="center" vertical>
        <n-steps :current="currentStep" :status="currentStatus">
          <n-step
            title="选择存储程序"
          />
          <n-step
            title="配置存储程序"
          />
          <n-step
            title="选择存储策略"
            flex="![0]"
          />
        </n-steps>
      </n-space>

      <div ma mt7 max-w-135>
        <n-select v-if="currentStep === 1" v-model:value="selectStorageValue" :options="selectStorageOptions" />
        <keep-alive>
          <component :is="selectStorageValue" v-if="currentStep === 2" ref="storageComponentRef" />
        </keep-alive>
        <n-select v-if="currentStep === 3" v-model:value="lskyProStrategiesVal" :options="lskyProStrategies" />
      </div>
    </div>
    <template #footer>
      <n-flex justify="space-between">
        <NButton strong secondary :focusable="false" @click="processStep('cancel')">
          取消
        </NButton>
        <n-flex>
          <NButton v-if="currentStep > 1" type="primary" :focusable="false" strong secondary @click="processStep('prev')">
            上一步
          </NButton>
          <NButton v-if="currentStep < 3" type="primary" :loading="nextLoading" :focusable="false" strong secondary @click="processStep('next')">
            下一步
          </NButton>
          <NButton v-if="currentStep === 3" type="primary" :focusable="false" strong secondary @click="processStep('save')">
            完成
          </NButton>
        </n-flex>
      </n-flex>
    </template>
  </n-modal>
</template>

<style scoped></style>
