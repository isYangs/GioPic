interface LinkTypeMap { [key: string]: string }

const linkTypeMap: LinkTypeMap = {
  url: 'URL',
  html: 'HTML',
  bbcode: 'BBcode',
  markdown: 'Markdown',
  markdown_with_link: 'Markdown With Link',
  thumbnail_url: 'Thumbnail URL',
}

export function getFormatLinkType(linkType: string) {
  return linkTypeMap[linkType] || linkType
}

export function getLinkTypeOptions() {
  return Object.entries(linkTypeMap).map(([value, label]) => ({ label, value }))
}
