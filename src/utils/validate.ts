import type { FormItemRule } from 'naive-ui'

const urlPattern = /^https?:\/\/.*/
const tokenPattern = /^\d+\|[A-Za-z0-9]{40}$/

export function createFormRule(validator: (value: any) => boolean | Error): FormItemRule {
  return {
    required: true,
    validator: async (_: any, value: any) => {
      const result = validator(value)
      if (result instanceof Error)
        throw result.message
    },
    trigger: ['input', 'blur', 'change'],
  }
}

// 验证URL是否合法
export function validateUrl(url: string) {
  if (!url)
    return new Error('API地址不能为空')
  else if (!urlPattern.test(url))
    return new Error('请输入正确的API地址，必须包含http://或https://')

  return true
}

// 验证兰空Token是否有效
export function validateLskyToken(token: string) {
  if (!token)
    return new Error('Token不能为空')
  else if (!tokenPattern.test(token))
    return new Error('Token格式不正确，请参考示例格式填写！')

  return true
}

// 验证存储策略是否合法
export function validateStrategiesVal(strategiesVal: number | null) {
  if (!strategiesVal && strategiesVal !== 0)
    return new Error('存储策略不能为空')

  return true
}

// 验证存储策略是否合法
export function validateImgLinkFormatVal(imgLinkFormatVal: string[]) {
  if (!imgLinkFormatVal || imgLinkFormatVal.length === 0)
    return new Error('图片链接格式不能为空')

  return true
}
