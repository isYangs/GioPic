import type { ModalReactive, ModalOptions as NModalOptions } from 'naive-ui'
import type { Component } from 'vue'

const usingModal = new Map<string, ModalReactive>()

// 关闭窗口时，应保证模态框的状态被清除
export function clearUsingModal() {
  usingModal.forEach(modal => modal?.destroy())
  usingModal.clear()
}

interface ModalContent {
  comp: Component
  props?: Record<string, any>
}

/**
 * 创建唯一的模态框，如果key已存在则直接返回
 *
 * @param key 唯一标识，默认作为模态框标题，可于`nOptions`中传入`title`覆盖
 * @param nOptions Naive UI 模态框配置
 * @param content 模态框内容组件
 * @param contentProps 模态框内容组件的props
 */

export function useUniqueModal(key: string, content: Component | ModalContent, nOptions?: NModalOptions) {
  if (usingModal.has(key)) {
    usingModal.get(key)?.destroy()
    usingModal.delete(key)
  }

  const modalContent = (content as ModalContent)?.props ? content as ModalContent : { comp: content } as ModalContent

  const modal = window.$modal.create({
    autoFocus: false,
    bordered: false,
    closeOnEsc: false,
    maskClosable: false,
    onClose,
    preset: 'card',
    title: key,
    transformOrigin: 'center',
    ...nOptions,

    content: () => h(modalContent.comp, {
      onClose,
      ...modalContent.props,
    }),
  })

  function onClose() {
    modal?.destroy()
    usingModal.delete(key)
  }

  usingModal.set(key, modal)
}
