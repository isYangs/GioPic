#!/bin/bash
# 发布脚本，自动处理预发行版本的 npm 标签，兼容 changesets 工作流

set -e

echo "🚀 发布包到 npm..."

# 需要 NODE_AUTH_TOKEN 环境变量
if [ -z "$NODE_AUTH_TOKEN" ]; then
  echo "❌ 错误: NODE_AUTH_TOKEN 环境变量未设置"
  exit 1
fi

remote_tag_exists() {
  git ls-remote --exit-code --tags origin "refs/tags/$1" > /dev/null 2>&1
}

github_release_exists() {
  local release_tag="$1"

  if [ -z "${GITHUB_REPOSITORY:-}" ] || [ -z "${GITHUB_TOKEN:-}" ]; then
    remote_tag_exists "$release_tag"
    return
  fi

  local encoded_tag
  encoded_tag=$(jq -rn --arg tag "$release_tag" '$tag | @uri')

  local status
  status=$(curl -sS -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/releases/tags/$encoded_tag" || echo "000")

  [ "$status" = "200" ]
}

announce_release_tag() {
  local release_tag="$1"

  if github_release_exists "$release_tag"; then
    echo "ℹ️  GitHub Release $release_tag 已存在，跳过 release 创建"
    return
  fi

  echo "🏷️  GitHub Release $release_tag 缺失，交给 changesets/action 创建"
  echo "New tag: $release_tag"
}

# 遍历所有包目录
for package_dir in packages/*/; do
  if [ ! -f "$package_dir/package.json" ]; then
    continue
  fi

  package_name=$(jq -r '.name' "$package_dir/package.json" 2>/dev/null || echo "")
  version=$(jq -r '.version' "$package_dir/package.json" 2>/dev/null || echo "")
  is_private=$(jq -r '.private // false' "$package_dir/package.json" 2>/dev/null || echo "false")

  # 跳过空值和 private 包
  if [ -z "$package_name" ] || [ "$package_name" = "null" ] || [ -z "$version" ] || [ "$version" = "null" ] || [ "$is_private" = "true" ]; then
    continue
  fi

  # 检查是否为预发行版本并设置正确的标签
  if [[ "$version" =~ -alpha\. ]] || [[ "$version" =~ -beta\. ]] || [[ "$version" =~ -rc\. ]] || [[ "$version" =~ -next\. ]]; then
    tag="next"
  else
    tag="latest"
  fi

  release_tag="$package_name@$version"

  if npm view "$package_name@$version" version > /dev/null 2>&1; then
    echo "⏭️  $package_name@$version 已存在于 npm，跳过发布"
    announce_release_tag "$release_tag"
    continue
  fi

  echo "📦 发布 $package_name@$version (tag: $tag)..."

  if (
    cd "$package_dir"
    npm publish --tag "$tag" --access public
  ); then
    echo "✅ $package_name@$version 发布成功"
    announce_release_tag "$release_tag"
  else
    echo "⚠️  $package_name@$version 发布失败"
    exit 1
  fi
done

echo "✅ 发布流程完成！"
