export interface PasteUploadOptions {
  onPaste?: (files: File[]) => void
}

export function usePasteUpload(options: PasteUploadOptions = {}) {
  const { onPaste } = options

  useEventListener('paste', async (e) => {
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
