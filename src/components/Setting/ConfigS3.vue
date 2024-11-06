<script setup lang="ts">
import type { FormRules } from 'naive-ui'
import { NButton, NSelect } from 'naive-ui'
import CodeInput from '~/components/Common/CodeInput.vue'
import type { ProgramsName } from '~/types'
import { getProgramsName } from '~/utils'

const route = useRoute('/Setting/[id]')
const id = ref(route.params.id as ProgramsName)
const programsStore = useProgramsStore()
const api = ref('')
const token = ref('')
const strategiesVal = ref<number | null>(null)

const settings = computed(() => programsStore.getPrograms(id.value))

const setItem = useTemplateRef('setItemRef')

const rules: FormRules = {
  apiUrl: createFormRule(() => validateUrl(api.value)),
  token: createFormRule(() => validateLskyToken(token.value)),
}

const settingOptions = computed(() => [
  {
    name: '测试',
    width: 300,
    component: () => {
      return h(CodeInput, {
        value: api.value,
        type: 'url',
      })
    },
  },
])
</script>

<template>
  <div wh-full>
    <SettingSection ref="setItemRef" class="pt0" :title="getProgramsName(id)" :items="settingOptions" :rules />
  </div>
</template>
