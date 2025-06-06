<script setup lang="ts">
import dayjs from 'dayjs'
import { ipcApi } from '~/api'
import { useProgramStore } from '~/stores'
import { convertFileSize, generateLink, getLinkTypeOptions } from '~/utils/main'

const programStore = useProgramStore()
const uploadData = ref<GP.DB.UploadData[]>([])
const filteredData = ref<GP.DB.UploadData[]>([])
const searchKeyword = ref('')
const selectedFormat = ref<string | null>(null)
const selectedProgram = ref<string | null>(null)
const selectedTimeRange = ref<string | null>(null)
const sortBy = ref('time')
const sortOrder = ref('desc')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const imagesInfoModal = ref(false)
const currentImagesData = ref<GP.DB.UploadData>()
const loading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const paginatedData = computed(() => currentPageData.value)
const hasData = computed(() => filteredData.value.length > 0)

const gridCols = computed(() => 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5')
const formatOptions = computed(() => {
  const formats = [...new Set(uploadData.value.map(item => item.mimetype).filter(Boolean))]
  return formats.map(format => ({ label: format, value: format }))
})

const programOptions = computed(() => {
  const programIds = [...new Set(uploadData.value.map(item => item.program_id).filter(Boolean))]
  return programIds.map((programId) => {
    const programName = getProgramDisplayName(programId)
    return { label: programName, value: String(programId) }
  })
})

const timeRangeOptions = [
  { label: '今天', value: 'today' },
  { label: '最近一周', value: 'week' },
  { label: '最近一月', value: 'month' },
  { label: '最近三月', value: 'quarter' },
]

const sortOptions = [
  { label: '上传时间', value: 'time' },
  { label: '文件名称', value: 'name' },
  { label: '文件大小', value: 'size' },
]

async function loadUploadData() {
  loading.value = true
  try {
    uploadData.value = await ipcApi.fetchAllUploadData() || []
    applyFilters()
  }
  catch (e) {
    console.error('加载图片数据失败:', e)
    window.$message.error('加载图片数据失败')
  }
  finally {
    loading.value = false
  }
}

function applyFilters() {
  let filtered = [...uploadData.value]

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.name?.toLowerCase().includes(keyword)
      || item.origin_name?.toLowerCase().includes(keyword),
    )
  }

  if (selectedFormat.value) {
    filtered = filtered.filter(item => item.mimetype?.includes(selectedFormat.value!))
  }

  if (selectedProgram.value) {
    filtered = filtered.filter(item => String(item.program_id) === selectedProgram.value!)
  }

  // 时间范围筛选
  if (selectedTimeRange.value) {
    const now = dayjs()
    const ranges = {
      today: now.startOf('day'),
      week: now.subtract(7, 'day'),
      month: now.subtract(30, 'day'),
      quarter: now.subtract(90, 'day'),
    }

    filtered = filtered.filter((item) => {
      if (!item.time)
        return false
      const uploadTime = dayjs(item.time)
      const compareTime = ranges[selectedTimeRange.value! as keyof typeof ranges]
      return compareTime ? uploadTime.isAfter(compareTime) : true
    })
  }

  // 排序
  filtered.sort((a, b) => {
    const getValue = (item: GP.DB.UploadData) => {
      switch (sortBy.value) {
        case 'time': return dayjs(item.time || 0)
        case 'name': return item.name || ''
        case 'size': return item.size || 0
        default: return 0
      }
    }

    const aVal = getValue(a)
    const bVal = getValue(b)
    return sortOrder.value === 'desc' ? (aVal > bVal ? -1 : 1) : (aVal < bVal ? -1 : 1)
  })

  filteredData.value = filtered
  total.value = filtered.length

  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = 1
  }
}

function onPageChange(page: number) {
  currentPage.value = page
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

async function delImage(key: string) {
  try {
    await ipcApi.deleteUploadData(key)
    window.$message.success('删除成功')
    await loadUploadData()
  }
  catch (e) {
    console.error('删除图片失败:', e)
    window.$message.error('删除失败')
  }
}

function copyLink(type: string, key: string) {
  const item = uploadData.value.find(item => item.key === key)
  if (!item) {
    window.$message.error('图片数据不存在')
    return
  }

  navigator.clipboard
    .writeText(generateLink(type, item.url, item.name))
    .then(() => window.$message.success('复制成功'))
    .catch(() => window.$message.error('复制失败'))
}

function getProgramDisplayName(programId: number | undefined) {
  if (!programId)
    return '未知存储'
  const program = programStore.getProgram(programId)
  if (!program || program.type === 'unknown') {
    return '已删除的存储'
  }
  return program?.name || program?.type || '已删除的存储'
}

function openImagesInfoModal(data: GP.DB.UploadData) {
  currentImagesData.value = data
  imagesInfoModal.value = true
}

function clearFilters() {
  searchKeyword.value = ''
  selectedFormat.value = null
  selectedProgram.value = null
  selectedTimeRange.value = null
  sortBy.value = 'time'
  sortOrder.value = 'desc'
}

watch([searchKeyword, selectedFormat, selectedProgram, selectedTimeRange, sortBy, sortOrder], applyFilters)
onMounted(loadUploadData)
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-shrink-0">
      <div class="space-y-2">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="min-w-0 flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
            <n-input
              v-model:value="searchKeyword"
              placeholder="搜索图片..."
              class="w-full lg:w-72"
              clearable
            >
              <template #prefix>
                <div i-ph-magnifying-glass class="text-gray-400" />
              </template>
            </n-input>

            <div class="flex items-center gap-4">
              <n-button-group>
                <n-button
                  size="small"
                  :type="viewMode === 'grid' ? 'primary' : 'default'"
                  :ghost="viewMode !== 'grid'"
                  @click="viewMode = 'grid'"
                >
                  <template #icon>
                    <div i-ph-grid-four />
                  </template>
                </n-button>
                <n-button
                  size="small"
                  :type="viewMode === 'list' ? 'primary' : 'default'"
                  :ghost="viewMode !== 'list'"
                  @click="viewMode = 'list'"
                >
                  <template #icon>
                    <div i-ph-list />
                  </template>
                </n-button>
              </n-button-group>

              <n-button size="small" ghost :loading="loading" @click="loadUploadData">
                <template #icon>
                  <div i-ph-arrow-clockwise />
                </template>
              </n-button>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center">
            <div class="flex flex-wrap items-center gap-3">
              <n-select
                v-model:value="selectedFormat"
                :options="formatOptions"
                class="w-full sm:w-32"
                placeholder="文件类型"
                clearable
              />
              <n-select
                v-model:value="selectedProgram"
                :options="programOptions"
                class="w-full sm:w-32"
                placeholder="存储程序"
                clearable
              />
              <n-select
                v-model:value="selectedTimeRange"
                :options="timeRangeOptions"
                class="w-full sm:w-32"
                placeholder="上传时间"
                clearable
              />
              <n-select
                v-model:value="sortBy"
                :options="sortOptions"
                class="w-full sm:w-32"
                placeholder="排序方式"
              />
            </div>

            <div class="flex items-center gap-3">
              <n-button size="small" ghost @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'">
                <template #icon>
                  <div :class="sortOrder === 'desc' ? 'i-ph-sort-descending' : 'i-ph-sort-ascending'" />
                </template>
              </n-button>

              <n-button
                v-if="searchKeyword || selectedFormat || selectedProgram || selectedTimeRange"
                size="small"
                ghost
                @click="clearFilters"
              >
                <template #icon>
                  <div i-ph-x />
                </template>
                清空
              </n-button>
            </div>
          </div>

          <div class="text-sm text-gray-500">
            共 {{ total }} 张图片
          </div>
        </div>
      </div>
    </div>

    <div class="min-h-0 flex-1 py-6">
      <n-spin :show="loading">
        <template v-if="hasData">
          <n-image-group v-if="viewMode === 'grid'">
            <div class="grid gap-4" :class="gridCols">
              <n-card
                v-for="item in paginatedData"
                :key="item.key"
                bordered
                class="rounded-2"
                content-class="!p-2"
              >
                <n-image
                  :src="item.url"
                  :alt="item.name"
                  lazy
                  class="block h-60 w-full rounded"
                  object-fit="cover"
                  style="image-rendering: optimizeQuality"
                >
                  <template #placeholder>
                    <n-skeleton height="100%" width="100%" />
                  </template>
                </n-image>

                <div class="mt-2">
                  <h3 class="truncate text-base text-gray-900 font-medium dark:text-gray-100">
                    {{ item.name }}
                  </h3>
                  <div class="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{{ convertFileSize(item.size) }}</span>
                    <span>{{ item.mimetype?.split('/')[1]?.toUpperCase() }}</span>
                  </div>

                  <div class="mt-2 flex gap-1">
                    <n-dropdown
                      trigger="hover"
                      :options="getLinkTypeOptions()"
                      @select="(type: string) => copyLink(type, item.key)"
                    >
                      <n-button type="primary" class="flex-1" size="small" @click="copyLink('url', item.key)">
                        复制
                      </n-button>
                    </n-dropdown>

                    <n-button size="small" ghost @click="openImagesInfoModal(item)">
                      <template #icon>
                        <div i-ph-info />
                      </template>
                    </n-button>

                    <n-button size="small" type="error" ghost @click="delImage(item.key)">
                      <template #icon>
                        <div i-ph-trash />
                      </template>
                    </n-button>
                  </div>
                </div>
              </n-card>
            </div>
          </n-image-group>

          <div v-else class="space-y-2">
            <n-card
              v-for="item in paginatedData"
              :key="item.key"
              bordered
              class="rounded-2"
              content-class="!p-3"
            >
              <div class="flex items-center gap-4">
                <n-image
                  :src="item.url"
                  :alt="item.name"
                  class="block h-12 w-12 rounded"
                  object-fit="cover"
                  style="image-rendering: optimizeQuality"
                >
                  <template #placeholder>
                    <n-skeleton height="100%" width="100%" />
                  </template>
                </n-image>

                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-gray-900 font-medium dark:text-gray-100">
                    {{ item.name }}
                  </h3>
                  <div class="mt-1 flex items-center gap-4 text-sm text-gray-500">
                    <span>{{ convertFileSize(item.size) }}</span>
                    <span>{{ item.mimetype?.split('/')[1]?.toUpperCase() }}</span>
                    <span>{{ dayjs(item.time).format('MM-DD HH:mm') }}</span>
                    <span>{{ getProgramDisplayName(item.program_id) }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <n-dropdown
                    trigger="hover"
                    :options="getLinkTypeOptions()"
                    @select="(type: string) => copyLink(type, item.key)"
                  >
                    <n-button size="small" tertiary @click="copyLink('url', item.key)">
                      <template #icon>
                        <div i-ph-copy />
                      </template>
                    </n-button>
                  </n-dropdown>

                  <n-button size="small" type="info" tertiary @click="openImagesInfoModal(item)">
                    <template #icon>
                      <div i-ph-info />
                    </template>
                  </n-button>

                  <n-button size="small" type="error" tertiary @click="delImage(item.key)">
                    <template #icon>
                      <div i-ph-trash />
                    </template>
                  </n-button>
                </div>
              </div>
            </n-card>
          </div>

          <div class="mt-8 flex justify-center">
            <n-pagination
              v-model:page="currentPage"
              v-model:page-size="pageSize"
              :page-count="totalPages"
              :page-sizes="[20, 50, 100]"
              show-size-picker
              :disabled="loading"
              @update:page="onPageChange"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </template>

        <n-empty v-else-if="!loading" class="mt-20" description="没有找到图片">
          <template #extra>
            <n-button ghost @click="clearFilters">
              清空筛选
            </n-button>
          </template>
        </n-empty>
      </n-spin>
    </div>

    <n-modal
      v-model:show="imagesInfoModal"
      preset="card"
      title="图片详情"
      class="max-w-2xl"
      :mask-closable="true"
      :auto-focus="false"
    >
      <div v-if="currentImagesData" class="space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600 dark:text-gray-400">名称</span>
            <p class="mt-1 text-gray-900 dark:text-gray-100">
              {{ currentImagesData.name }}
            </p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">原始名称</span>
            <p class="mt-1 text-gray-900 dark:text-gray-100">
              {{ currentImagesData.origin_name || currentImagesData.name }}
            </p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">大小</span>
            <p class="mt-1 text-gray-900 dark:text-gray-100">
              {{ convertFileSize(currentImagesData.size) }}
            </p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">类型</span>
            <p class="mt-1 text-gray-900 dark:text-gray-100">
              {{ currentImagesData.mimetype }}
            </p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">存储程序</span>
            <p class="mt-1 text-gray-900 dark:text-gray-100">
              {{ getProgramDisplayName(currentImagesData.program_id) }}
            </p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">上传时间</span>
            <p class="mt-1 text-gray-900 dark:text-gray-100">
              {{ dayjs(currentImagesData.time).format('YYYY-MM-DD HH:mm:ss') }}
            </p>
          </div>
        </div>

        <div>
          <span class="text-gray-600 dark:text-gray-400">链接</span>
          <div class="mt-2">
            <n-input :value="currentImagesData.url" readonly size="small">
              <template #suffix>
                <n-button text size="small" @click="copyLink('url', currentImagesData.key)">
                  <div i-ph-copy />
                </n-button>
              </template>
            </n-input>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<style scoped>
.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

:deep(.n-image img) {
  width: 100%;
  height: 100%;
}
</style>
