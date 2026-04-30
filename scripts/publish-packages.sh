#!/bin/bash
# 发布脚本，自动处理预发行版本的 npm 标签，兼容 changesets 工作流

set -e

echo "🚀 发布包到 npm..."

# 需要 NODE_AUTH_TOKEN 环境变量
if [ -z "$NODE_AUTH_TOKEN" ]; then
  echo "❌ 错误: NODE_AUTH_TOKEN 环境变量未设置"
  exit 1
fi

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

  if npm view "$package_name@$version" version > /dev/null 2>&1; then
    echo "⏭️  $package_name@$version 已存在于 npm，跳过发布"
    continue
  fi

  echo "📦 发布 $package_name@$version (tag: $tag)..."

  if (
    cd "$package_dir"
    npm publish --tag "$tag" --access public
  ); then
    echo "✅ $package_name@$version 发布成功"
  else
    echo "⚠️  $package_name@$version 发布失败"
    exit 1
  fi
done

echo "✅ 发布流程完成！"
