export interface PasteUploadOptions {
  onPaste?: (files: File[]) => void
  enabled?: Ref<boolean>
}

export function usePasteUpload(options: PasteUploadOptions = {}) {
  const { onPaste, enabled } = options

  useEventListener('paste', async (e) => {
    if (enabled && !enabled.value)
      return

    const items = e.clipboardData?.items
    if (!items)
      return

    const imageFiles = Array.from(items)
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter(Boolean) as File[]

    if (imageFiles.length > 0) {
      onPaste?.(imageFiles)
    }
  }, { passive: true })

  return {}
}
