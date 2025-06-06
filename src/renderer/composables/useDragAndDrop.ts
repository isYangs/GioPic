import { useFileExtractor } from './useFileExtractor'

export interface DragAndDropOptions {
  onDrop?: (files: File[]) => void
  onError?: (message: string) => void
}

export function useDragAndDrop(options: DragAndDropOptions = {}) {
  const { onDrop, onError } = options
  const { extractFilesFromDragEvent } = useFileExtractor()

  const isOverDropZone = ref(false)
  const dragCounter = ref(0)

  const updateDragState = (isDragging: boolean) => {
    isOverDropZone.value = isDragging
  }

  const preventDefaults = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDragEnter = (e: DragEvent) => {
    preventDefaults(e)
    dragCounter.value++
    if (dragCounter.value === 1)
      updateDragState(true)
  }

  const onDragOver = (e: DragEvent) => {
    preventDefaults(e)
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
  }

  const onDragLeave = (e: DragEvent) => {
    preventDefaults(e)
    dragCounter.value--
    if (dragCounter.value === 0)
      updateDragState(false)
  }

  const processDrop = async (e: DragEvent) => {
    preventDefaults(e)
    dragCounter.value = 0
    updateDragState(false)

    try {
      const files = await extractFilesFromDragEvent(e)
      if (files.length > 0) {
        onDrop?.(files)
      }
      else {
        onError?.('未找到有效文件')
      }
    }
    catch (e) {
      console.error('拖拽文件处理失败:', e)
      onError?.('拖拽文件处理失败')
    }
  }

  const setupDragAndDrop = (element: HTMLElement) => {
    if (!element)
      return

    element.addEventListener('dragenter', onDragEnter)
    element.addEventListener('dragover', onDragOver)
    element.addEventListener('dragleave', onDragLeave)
    element.addEventListener('drop', processDrop)

    return () => {
      element.removeEventListener('dragenter', onDragEnter)
      element.removeEventListener('dragover', onDragOver)
      element.removeEventListener('dragleave', onDragLeave)
      element.removeEventListener('drop', processDrop)
    }
  }

  return {
    isOverDropZone: readonly(isOverDropZone),
    setupDragAndDrop,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop: processDrop,
  }
}
