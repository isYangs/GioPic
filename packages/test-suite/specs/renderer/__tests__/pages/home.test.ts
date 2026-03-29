import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import Home from '~/pages/Home.vue'

const mockRefs = vi.hoisted(() => {
  return {
    defaultProgram: null as any,
    uploadData: null as any,
    isUpload: null as any,
    openFileDialog: vi.fn(),
    onFileDialogChange: vi.fn(),
    processFiles: vi.fn(),
    uploadSingleImage: vi.fn(),
    uploadBatchImages: vi.fn(),
    ipcInvoke: vi.fn(),
    ipcOn: vi.fn(),
    messageSuccess: vi.fn(),
    messageInfo: vi.fn(),
    messageError: vi.fn(),
    getProgramList: vi.fn(() => []),
    getProgram: vi.fn(() => ({ id: 1, pluginId: 'giopic-lskypro', detail: { api: 'https://api.example.com' } })),
    delData: vi.fn((index?: number) => {
      if (index === undefined) {
        mockRefs.uploadData.value = []
      }
      else {
        mockRefs.uploadData.value.splice(index, 1)
      }
    }),
  }
})

vi.mock('radash', () => ({
  debounce: (_options: any, fn: any) => fn,
}))

vi.mock('~/composables/useDragAndDrop', () => ({
  useDragAndDrop: () => ({
    isOverDropZone: ref(false),
    onDragEnter: vi.fn(),
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(async () => null),
  }),
}))

vi.mock('~/composables/useFileProcessor', () => ({
  useFileProcessor: () => ({
    processFiles: mockRefs.processFiles,
  }),
}))

vi.mock('~/composables/useImageUpload', () => ({
  useImageUpload: () => ({
    isUpload: mockRefs.isUpload,
    uploadSingleImage: mockRefs.uploadSingleImage,
    uploadBatchImages: mockRefs.uploadBatchImages,
  }),
}))

vi.mock('~/composables/usePasteUpload', () => ({
  usePasteUpload: vi.fn(),
}))

vi.mock('~/stores', () => ({
  useAppStore: () => ({
    defaultProgram: mockRefs.defaultProgram,
  }),
  useProgramStore: () => ({
    getProgramList: mockRefs.getProgramList,
    getProgram: mockRefs.getProgram,
  }),
  useUploadDataStore: () => ({
    data: mockRefs.uploadData,
    $state: {
      get data() {
        return mockRefs.uploadData.value
      },
      set data(v: any[]) {
        mockRefs.uploadData.value = v
      },
    },
    delData: mockRefs.delData,
  }),
}))

const UploadAreaStub = defineComponent({
  name: 'UploadArea',
  emits: ['select-files'],
  template: '<button data-test="upload-area" @click="$emit(\'select-files\')">area</button>',
})

const UploadControlsStub = defineComponent({
  name: 'UploadControls',
  emits: ['upload-batch', 'clear-all', 'copy-all-urls', 'update-is-all-public', 'update-default-program'],
  template: '<div data-test="upload-controls" />',
})

const ImageGridStub = defineComponent({
  name: 'ImageGrid',
  emits: ['remove-image', 'upload-single'],
  template: '<div data-test="image-grid" />',
})

function mountHome() {
  return mount(Home, {
    global: {
      stubs: {
        'upload-area': UploadAreaStub,
        'upload-controls': UploadControlsStub,
        'image-grid': ImageGridStub,
      },
    },
  })
}

describe('home page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockRefs.defaultProgram = ref<number | null>(null)
    mockRefs.uploadData = ref<any[]>([])
    mockRefs.isUpload = ref(false)
    mockRefs.processFiles.mockResolvedValue(1)

    vi.stubGlobal('definePage', vi.fn())
    vi.stubGlobal('storeToRefs', (store: any) => store)
    vi.stubGlobal('useFileDialog', () => ({
      open: mockRefs.openFileDialog,
      onChange: mockRefs.onFileDialogChange,
    }))

    Object.defineProperty(window, 'ipcRenderer', {
      configurable: true,
      writable: true,
      value: {
        invoke: mockRefs.ipcInvoke,
        on: mockRefs.ipcOn,
      },
    })

    Object.defineProperty(window, '$message', {
      configurable: true,
      writable: true,
      value: {
        success: mockRefs.messageSuccess,
        info: mockRefs.messageInfo,
        error: mockRefs.messageError,
      },
    })

    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('数据为空时仅显示上传区，不显示控制区和网格', () => {
    const wrapper = mountHome()

    expect(wrapper.find('[data-test="upload-area"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="upload-controls"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="image-grid"]').exists()).toBe(false)
  })

  it('点击上传区会打开文件选择器', async () => {
    const wrapper = mountHome()
    await wrapper.find('[data-test="upload-area"]').trigger('click')

    expect(mockRefs.openFileDialog).toHaveBeenCalledTimes(1)
  })

  it('触发复制全部链接时，无可用链接会提示', async () => {
    mockRefs.uploadData.value = [{ id: '1', name: 'a.jpg' }]
    const wrapper = mountHome()

    const controls = wrapper.findComponent(UploadControlsStub)
    controls.vm.$emit('copy-all-urls')
    await nextTick()

    expect(mockRefs.messageInfo).toHaveBeenCalledWith('没有可以复制的图片链接')
  })

  it('切换存储程序会重置上传状态并检查权限禁用状态', async () => {
    mockRefs.uploadData.value = [{
      id: '1',
      name: 'test.jpg',
      uploaded: true,
      uploadFailed: true,
      file: { name: 'test.jpg' },
      metadata: { width: 100, height: 100 },
    }]
    mockRefs.ipcInvoke.mockResolvedValue(true)

    const wrapper = mountHome()
    const controls = wrapper.findComponent(UploadControlsStub)

    controls.vm.$emit('update-default-program', 1)
    await nextTick()
    await nextTick()

    expect(mockRefs.defaultProgram.value).toBe(1)
    expect(mockRefs.uploadData.value[0].uploaded).toBe(false)
    expect(mockRefs.uploadData.value[0].uploadFailed).toBe(false)
    expect(mockRefs.ipcInvoke).toHaveBeenCalledWith('should-disable-permission-select', {
      pluginId: 'giopic-lskypro',
      config: { api: 'https://api.example.com' },
    })
  })
})
